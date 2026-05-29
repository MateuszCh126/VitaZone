import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ChatRequestSchema } from '../../schemas/chatSchema.js';
import env from '../config/env.js';
import logger from '../config/logger.js';
import * as productRepo from '../../repositories/productRepository.js';

const googleApiKeyCandidates = [
    ['GOOGLE_GENERATIVE_AI_API_KEY', env.GOOGLE_GENERATIVE_AI_API_KEY],
    ['GEMINI_API_KEY', env.GEMINI_API_KEY],
    ['GOOGLE_API_KEY', env.GOOGLE_API_KEY],
    ['GOOGLE_AI_API_KEY', env.GOOGLE_AI_API_KEY],
    ['AI_GATEWAY_API_KEY', env.AI_GATEWAY_API_KEY.startsWith('AIza') ? env.AI_GATEWAY_API_KEY : '']
];

const configuredGoogleApiKey = googleApiKeyCandidates.find(([, value]) => Boolean(value));
const googleApiKey = configuredGoogleApiKey?.[1] || '';
const googleApiKeySource = configuredGoogleApiKey?.[0] || null;

const google = googleApiKey
    ? createGoogleGenerativeAI({
        apiKey: googleApiKey,
    })
    : null;

const catalogCache = {
    snapshot: null,
    fetchedAt: 0
};

const circuitState = {
    failures: 0,
    openedAt: null
};

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORY_ALIASES = {
    'Jaszczurki i gekony': ['jaszczurki', 'jaszczurka', 'gekony', 'gekon', 'agama', 'agama brodata', 'skink'],
    'Węże': ['weze', 'węże', 'waz', 'wąż', 'pyton', 'zbozowy', 'zbożowy', 'lancuchowy', 'okeetee', 'nelsona'],
    'Żółwie': ['zolwie', 'żółwie', 'zolw', 'żółw'],
    'Płazy': ['plazy', 'płazy', 'plaz', 'płaz', 'aksolotl', 'rzekotka', 'kumak', 'drzewolaz'],
    'Ptaszniki i skorpiony': ['ptasznik', 'ptaszniki', 'skorpion', 'skorpiony', 'bezkregowce', 'bezkręgowce'],
    'Terraria i zestawy': ['terrarium', 'terraria', 'zestaw', 'setup', 'zbiornik', 'witryna', 'nano'],
    'Ogrzewanie i oświetlenie': ['grzanie', 'ogrzewanie', 'oswietlenie', 'oświetlenie', 'uvb', 'lampa', 'promiennik', 'termostat'],
    'Podłoża i dekoracje': ['podloze', 'podłoże', 'dekoracje', 'dekoracja', 'kryjowka', 'kryjówka', 'mch', 'chipsy', 'kora', 'tlo', 'tło'],
    'Pokarm i suplementy': ['pokarm', 'karma', 'owady', 'suplementy', 'wapn', 'wapń', 'mlecznik', 'swierszcz', 'świerszcz', 'karaczan']
};

const BEGINNER_HINTS = ['poczatkuj', 'początkuj', 'na start', 'pierwsze', 'latwy', 'łatwy', 'spokojny', 'dla nowicjusza'];

const sanitizeAssistantMessage = (text) => text
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/`(.*?)`/gs, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const CHAT_SYSTEM_PROMPT = `Jestes doswiadczonym doradca terrarystyki w sklepie "VitaZone".
Przedstawiasz sie wylacznie jako "Asystent terrarystyki".
Nigdy nie podajesz swojego imienia, nie wymyslasz sobie imienia, nie proponujesz uzytkownikowi wyboru imienia dla Ciebie i nie pytasz o imie uzytkownika, jesli nie jest to niezbedne.
Twoj cel: doradzac klientom w wyborze zwierzat egzotycznych i akcesoriow, ale zawsze w oparciu o realna oferte sklepu, jesli dostajesz kontekst katalogu.
Zasady:
1. ZAWSZE promuj odpowiedzialna hodowle.
2. Dla poczatkujacych polecaj gatunki latwe w hodowli, ale tylko jesli sa zgodne z dostepna oferta.
3. Odradzaj gatunki agresywne lub trudne osobom bez doswiadczenia.
4. Badz mily, pomocny i uzywaj fachowego, ale zrozumialego jezyka.
4a. Pisz naturalnie i bez nadmiernego formalizmu. Nie uzywaj form typu "Szanowny Panie/Pani", chyba ze klient sam pisze bardzo formalnie.
5. Jesli ktos pyta o psy, koty lub chomiki, uprzejmie wyjasnij, ze zajmujesz sie tylko zwierzetami egzotycznymi i terrariowymi.
6. Twoje odpowiedzi powinny byc zwiezle, konkretne i naturalne.
7. Pisz zwyklym, naturalnym tekstem bez markdownu, bez list punktowanych (gwiazdek, myslnikow, numeracji), bez gwiazdek, bez pogrubien i bez formatowania typu "**tekst**". Te zasady formatowania obowiazuja takze w jezyku angielskim (no markdown, no bolding, no bullet points/numbered lists).
8. Jesli dostajesz STORE_CONTEXT, traktuj go jako zrodlo prawdy o ofercie VitaZone i nie wymyslaj produktow, ktorych tam nie ma.
9. Gdy klient pyta o dostepne produkty, wymien 3-6 najlepiej pasujacych pozycji z oferty i przy kazdej napisz w jednym zdaniu, co ja wyroznia.
10. Koncz odpowiedzi pelnym, domknietym zdaniem.
11. Gdy sie witasz, uzyj formy: "Czesc, jestem Asystentem terrarystyki. Jak moge pomoc?" (or the English equivalent if greeted in English).
12. Dostosuj jezyk odpowiedzi (polski lub angielski) do jezyka, w ktorym pisze uzytkownik. Pisz naturalnie i plynnie.`;

const normalizeText = (value) => (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value, maxLength = 140) => {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const formatPrice = (priceCents) => `${(Number(priceCents) / 100).toFixed(0)} zł`;

const firstSentence = (value) => {
    if (!value) return '';
    const match = value.match(/.+?[.!?](\s|$)/);
    return truncate(match ? match[0].trim() : value.trim(), 160);
};

const isCircuitOpen = () => {
    if (!circuitState.openedAt) return false;
    if (Date.now() - circuitState.openedAt >= env.AI_CIRCUIT_RESET_MS) {
        circuitState.openedAt = null;
        circuitState.failures = 0;
        return false;
    }
    return true;
};

const registerFailure = () => {
    circuitState.failures += 1;
    if (circuitState.failures >= env.AI_CIRCUIT_FAILURE_THRESHOLD) {
        circuitState.openedAt = Date.now();
    }
};

const registerSuccess = () => {
    circuitState.failures = 0;
    circuitState.openedAt = null;
};

const getCatalogSnapshot = async () => {
    const now = Date.now();
    if (catalogCache.snapshot && now - catalogCache.fetchedAt < CATALOG_CACHE_TTL_MS) {
        return catalogCache.snapshot;
    }

    const [products, categories] = await Promise.all([
        productRepo.getAllProducts(1, 100),
        productRepo.getAllCategories()
    ]);

    const snapshot = {
        products,
        categories
    };

    catalogCache.snapshot = snapshot;
    catalogCache.fetchedAt = now;

    return snapshot;
};

const getLatestUserMessage = (messages) => [...messages].reverse().find((message) => message.role === 'user')?.content || '';

const getMatchedCategories = (normalizedQuery, categories) => {
    const matches = new Set();

    categories.forEach((category) => {
        const normalizedName = normalizeText(category.name);
        const aliases = CATEGORY_ALIASES[category.name] || [];
        if (normalizedQuery.includes(normalizedName)) {
            matches.add(category.name);
            return;
        }
        if (aliases.some((alias) => normalizedQuery.includes(normalizeText(alias)))) {
            matches.add(category.name);
        }
    });

    return [...matches];
};

const scoreProductAgainstQuery = (product, normalizedQuery, matchedCategories) => {
    const haystack = normalizeText([
        product.name,
        product.species,
        product.description,
        product.category_name
    ].filter(Boolean).join(' '));

    let score = 0;

    if (matchedCategories.includes(product.category_name)) {
        score += 8;
    }

    const tokens = normalizedQuery.split(' ').filter((token) => token.length > 2);
    tokens.forEach((token) => {
        if (normalizeText(product.name).includes(token)) score += 4;
        if (normalizeText(product.species || '').includes(token)) score += 3;
        if (normalizeText(product.category_name || '').includes(token)) score += 2;
        if (haystack.includes(token)) score += 1;
    });

    if (BEGINNER_HINTS.some((hint) => normalizedQuery.includes(hint))) {
        const beginnerFriendly = ['Gekon lamparci', 'Agama brodata', 'Wąż zbożowy', 'Żółw grecki'];
        if (beginnerFriendly.some((phrase) => product.name.includes(phrase))) {
            score += 4;
        }
    }

    return score;
};

const getRelevantProducts = (normalizedQuery, snapshot) => {
    const matchedCategories = getMatchedCategories(normalizedQuery, snapshot.categories);
    const ranked = snapshot.products
        .map((product) => ({
            product,
            score: scoreProductAgainstQuery(product, normalizedQuery, matchedCategories)
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || Number(b.product.stock) - Number(a.product.stock));

    const relevantProducts = ranked.map(({ product }) => product);

    return {
        matchedCategories,
        relevantProducts
    };
};

const buildCatalogReply = (userMessage, snapshot, context) => {
    const normalizedQuery = normalizeText(userMessage);
    const offerIntent = /(jakie|co|wymien|wypisz|pokaz|pokazesz|pokazecie|dostepne|dostepny|kupic|kupie|kupić|macie|oferta|u was)/.test(normalizedQuery);
    const comparisonIntent = /(czym sie wyroznia|czym sie roznia|roznice|wyróznia|wyróżnia|porownaj|porównaj)/.test(normalizedQuery);

    if (!offerIntent && !comparisonIntent) {
        return null;
    }

    let products = context.relevantProducts;

    if (products.length === 0 && context.matchedCategories.length === 1) {
        products = snapshot.products.filter((product) => product.category_name === context.matchedCategories[0]);
    }

    if (context.matchedCategories.length > 0) {
        const categoryProducts = products.filter((product) => context.matchedCategories.includes(product.category_name));
        if (categoryProducts.length > 0) {
            products = categoryProducts;
        }
    }

    if (products.length === 0) {
        return null;
    }

    const selectedProducts = products.slice(0, 5);
    const intro = context.matchedCategories.length > 0
        ? `W VitaZone mamy obecnie kilka pozycji w kategorii ${context.matchedCategories.join(', ')}. Najciekawsze opcje to:`
        : 'W VitaZone mamy obecnie kilka pasujących pozycji. Najciekawsze opcje to:';

    const lines = selectedProducts.map((product, index) => {
        const differentiator = firstSentence(product.description) || `Kategoria: ${product.category_name}.`;
        return `${index + 1}. ${product.name} (${formatPrice(product.price_cents)}) — ${differentiator}`;
    });

    return `${intro}\n${lines.join('\n')}\nJeśli chcesz, mogę od razu zawęzić wybór do opcji dla początkujących, spokojniejszych gatunków albo konkretnego budżetu.`;
};

const buildStoreContext = (userMessage, snapshot, context) => {
    const categoryBlock = snapshot.categories
        .map((category) => `- ${category.name}`)
        .join('\n');

    const relevantProducts = (context.relevantProducts.length > 0 ? context.relevantProducts : snapshot.products).slice(0, 8);
    const productBlock = relevantProducts
        .map((product) => `- ${product.name} | kategoria: ${product.category_name} | gatunek/specyfikacja: ${product.species || 'brak'} | cena: ${formatPrice(product.price_cents)} | stock: ${product.stock} | opis: ${truncate(product.description || '', 180)}`)
        .join('\n');

    return `STORE_CONTEXT
Zapytanie klienta: ${userMessage}
Kategorie w sklepie:
${categoryBlock}

Najbardziej pasujace produkty:
${productBlock}`;
};

export const getChatRuntimeHealth = () => ({
    configured: Boolean(google),
    provider: 'google-generative-ai',
    model: env.GOOGLE_GENERATIVE_AI_MODEL,
    apiKeySource: googleApiKeySource,
    circuitOpen: isCircuitOpen(),
    failures: circuitState.failures,
    openedAt: circuitState.openedAt,
    catalogCacheWarm: Boolean(catalogCache.snapshot),
    catalogCacheAgeMs: catalogCache.fetchedAt ? Date.now() - catalogCache.fetchedAt : null
});

export const handleChat = async (req, res) => {
    let clearTimer = null;

    try {
        if (!google) {
            return res.status(503).json({ error: 'Chat service is not configured.' });
        }

        if (isCircuitOpen()) {
            const retryAfterSec = Math.ceil((env.AI_CIRCUIT_RESET_MS - (Date.now() - circuitState.openedAt)) / 1000);
            res.setHeader('Retry-After', Math.max(1, retryAfterSec));
            return res.status(503).json({ error: 'Chat service temporarily unavailable. Please retry shortly.' });
        }

        const { messages } = ChatRequestSchema.parse(req.body);
        const latestUserMessage = getLatestUserMessage(messages);
        const snapshot = await getCatalogSnapshot();
        const normalizedQuery = normalizeText(latestUserMessage);
        const context = getRelevantProducts(normalizedQuery, snapshot);

        const catalogReply = buildCatalogReply(latestUserMessage, snapshot, context);
        if (catalogReply) {
            registerSuccess();
            return res.json({ message: catalogReply });
        }

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), env.AI_TIMEOUT_MS);

        clearTimer = () => clearTimeout(timeoutId);
        res.on('close', clearTimer);
        res.on('finish', clearTimer);

        const result = await generateText({
            model: google(env.GOOGLE_GENERATIVE_AI_MODEL),
            maxOutputTokens: 4096,
            abortSignal: abortController.signal,
            system: `${CHAT_SYSTEM_PROMPT}\n\n${buildStoreContext(latestUserMessage, snapshot, context)}`,
            providerOptions: {
                google: {
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_ONLY_HIGH'
                        },
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_ONLY_HIGH'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_ONLY_HIGH'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_ONLY_HIGH'
                        }
                    ]
                }
            },
            messages
        });

        const assistantMessage = sanitizeAssistantMessage(result.text || '');
        if (!assistantMessage) {
            registerFailure();
            return res.status(502).json({ error: 'Chat provider returned an empty response.' });
        }

        registerSuccess();
        res.json({ message: assistantMessage });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        if (error.name === 'AbortError') {
            registerFailure();
            return res.status(504).json({ error: 'Chat request timed out. Please retry.' });
        }
        registerFailure();
        logger.error('Chat API Error', {
            errorMessage: error?.message || 'Unknown chat error',
            errorName: error?.name || 'Error',
            apiKeySource: googleApiKeySource
        });
        res.status(500).json({ error: 'Failed to process chat request' });
    } finally {
        clearTimer?.();
    }
};
