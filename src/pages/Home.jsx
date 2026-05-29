import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  MessageCircleMore,
  Search,
  ShieldCheck,
  ShoppingBag,
  Thermometer,
  Warehouse
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { API_BASE } from '../utils/config';
import { FEATURED_CATEGORY_NAMES, STOREFRONT_CATEGORIES, getCategoryHref } from '../data/storefrontData';
import { getOptimizedImageUrl, getSrcSet } from '../utils/imageUtils';
import { getProductBadges } from '../utils/productBadges';
import { trackEvent } from '../utils/analytics';
import { fetchJsonWithRetry } from '../utils/fetchJson';

const featuredCategories = STOREFRONT_CATEGORIES.filter((category) => FEATURED_CATEGORY_NAMES.includes(category.name));

const valueCards = [
  {
    title: 'Starannie dobrane gatunki',
    description: 'Oferta skupia się na zwierzętach i konfiguracjach, które można prowadzić stabilnie w codziennej opiece.',
    icon: ShieldCheck
  },
  {
    title: 'Kompletna oferta do terrarium',
    description: 'Terraria, oświetlenie, podłoża, dekoracje i pokarm są zebrane w jednym, spójnym katalogu.',
    icon: Warehouse
  },
  {
    title: 'Wyposażenie dobrane do warunków',
    description: 'Łatwiej dobrać temperaturę, UVB i elementy potrzebne do bezpiecznej, odpowiedzialnej opieki.',
    icon: Thermometer
  }
];

const storeHighlights = [
  {
    title: 'Przemyślany katalog',
    description: 'Zwierzęta, terraria i akcesoria podzielone na czytelne, praktyczne działy.',
    icon: Warehouse
  },
  {
    title: 'Zakup bez chaosu',
    description: 'Szybciej połączysz gatunek, terrarium i wyposażenie w jeden sensowny koszyk.',
    icon: Search
  },
  {
    title: 'Bezpieczna płatność',
    description: 'Checkout działa przez Stripe, a płatność odbywa się na stronie Stripe.',
    icon: ShieldCheck
  },
  {
    title: 'Wsparcie przed zakupem',
    description: 'FAQ i czat pomagają dobrać pierwszy zestaw albo spokojnie rozbudować obecne terrarium.',
    icon: MessageCircleMore
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [shouldLoadFeaturedProducts, setShouldLoadFeaturedProducts] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await fetchJsonWithRetry(`${API_BASE || ''}/api/species/search?q=${encodeURIComponent(searchQuery)}`, {}, 1);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const enableFeaturedProducts = () => {
      React.startTransition(() => setShouldLoadFeaturedProducts(true));
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(enableFeaturedProducts, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(enableFeaturedProducts, 700);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!shouldLoadFeaturedProducts) {
      return undefined;
    }

    let isActive = true;

    const fetchFeaturedProducts = async () => {
      try {
        const data = await fetchJsonWithRetry(`${API_BASE}/api/products`);
        if (!Array.isArray(data) || !isActive) return;

        const featuredNames = [
          'Gekon lamparci Classic',
          'Wąż zbożowy Okeetee',
          'Terrarium szklane 60x45x45',
          'Karaczan dubia XL - pakiet 50 szt.'
        ];

        const sortedProducts = [...data].sort((left, right) => {
          const leftIndex = featuredNames.indexOf(left.name);
          const rightIndex = featuredNames.indexOf(right.name);
          const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
          const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
          return normalizedLeft - normalizedRight;
        });

        setFeaturedProducts(sortedProducts.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };

    fetchFeaturedProducts();

    return () => {
      isActive = false;
    };
  }, [shouldLoadFeaturedProducts]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      trackEvent('search_catalog', { query: searchQuery.trim() });
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative">
      <Helmet>
        <title>VitaZone | Zwierzęta egzotyczne, terraria i akcesoria</title>
        <meta
          name="description"
          content="VitaZone to sklep terrarystyczny online ze zwierzętami egzotycznymi, terrariami i akcesoriami do kompletnej aranżacji terrarium."
        />
      </Helmet>

      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden sm:min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <picture>
            <source
              type="image/avif"
              srcSet="/hero-bg-768.avif 768w, /hero-bg-1280.avif 1280w, /hero-bg-1920.avif 1920w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              srcSet="/hero-bg-768.webp 768w, /hero-bg-1280.webp 1280w, /hero-bg-1920.webp 1920w"
              sizes="100vw"
            />
            <img
              src="/hero-bg-1280.webp"
              alt=""
              width="1920"
              height="1920"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full scale-105 object-cover opacity-40"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-transparent"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-4xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80 sm:mb-4 sm:text-sm sm:tracking-[0.35em]">
              VitaZone
            </p>
            <h1 className="mb-6 text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-7xl lg:text-8xl">
              Terrarystyka bez przypadku.
              <span className="block text-primary">Zwierzęta, terraria i wyposażenie w jednym miejscu.</span>
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl">
              VitaZone łączy zwierzęta egzotyczne, terraria i akcesoria potrzebne do stworzenia spójnego, bezpiecznego terrarium.
            </p>

            <div className="relative z-20 mb-6 max-w-xl sm:mb-8">
              <form onSubmit={handleSearch} aria-label="Wyszukaj gatunek lub produkt" className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Szukaj gatunku, np. gekon, pyton, aksolotl"
                  autoComplete="off"
                  aria-label="Wpisz zapytanie"
                  className="w-full rounded-full border border-white/20 bg-white/10 py-3.5 pl-12 pr-5 text-white shadow-xl transition-all placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:py-4 sm:pr-6"
                />
              </form>

              {suggestions.length > 0 && searchQuery.length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-hidden overflow-y-auto rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl">
                  <ul>
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          navigate(`/shop?search=${encodeURIComponent(suggestion)}`);
                          setSuggestions([]);
                        }}
                        className="group flex cursor-pointer items-center justify-between px-4 py-3 text-gray-200 transition-colors hover:bg-white/10 sm:px-6"
                      >
                        <span>{suggestion}</span>
                        <ArrowRight size={14} className="text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-3.5 font-bold text-black transition-all duration-300 hover:bg-white sm:w-auto sm:px-8 sm:py-4"
              >
                Przejdź do katalogu
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/20 px-6 py-3.5 font-bold text-white transition-all duration-300 hover:bg-white/5 sm:w-auto sm:px-8 sm:py-4"
              >
                Poznaj VitaZone
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/5 py-8 sm:py-10">
        <div className="container mx-auto grid gap-6 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
          {storeHighlights.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <div key={highlight.title} className="rounded-2xl border border-white/5 bg-black/30 px-5 py-4 sm:px-6 sm:py-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <p className="text-lg font-bold text-white">{highlight.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{highlight.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative bg-bg-secondary py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Kategorie, które prowadzą od gatunku do gotowego terrarium</h2>
              <p className="text-gray-400">
                Podzieliliśmy ofertę tak, by łatwiej dobrać zwierzę, terrarium, ogrzewanie, dekoracje i pokarm w jednym zamówieniu.
              </p>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-2 text-primary transition-colors hover:text-white">
              Zobacz cały katalog <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featuredCategories.map((category) => (
              <div
                key={category.slug}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-black/30"
              >
                <Link to={getCategoryHref(category.name)} className="block h-full">
                  <div className="relative h-60 overflow-hidden sm:h-72">
                    <img
                      src={getOptimizedImageUrl(category.image, 900)}
                      srcSet={getSrcSet(category.image, [480, 800, 1200])}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                        {category.shortLabel}
                      </span>
                      <h3 className="text-2xl font-bold text-white sm:text-3xl">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-sm leading-relaxed text-gray-400">{category.description}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-10 max-w-2xl sm:mb-14">
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">Oferta, która ułatwia dobry wybór</h2>
            <p className="text-gray-400">
              Od pierwszego wejścia łatwiej zawęzisz wybór i dobierzesz produkty pasujące do gatunku oraz warunków utrzymania.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {valueCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Polecane na start</p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Najczęściej wybierane produkty</h2>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-2 text-primary transition-colors hover:text-white">
              Otwórz pełny katalog <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => {
              const badges = getProductBadges(product);
              return (
                <div key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <Link to={`/product/${product.id}`} className="block">
                    <img
                      src={getOptimizedImageUrl(product.image_urls?.[0], 900)}
                      srcSet={getSrcSet(product.image_urls?.[0], [480, 800, 1200])}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-56 w-full object-cover sm:h-64"
                    />
                  </Link>
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <span key={badge} className="rounded-full border border-primary/35 bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
                          {badge}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{product.category_name}</p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="mt-2 text-xl font-bold text-white transition-colors hover:text-primary">{product.name}</h3>
                    </Link>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{product.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="text-xl font-bold text-white sm:text-2xl">{product.price} zł</span>
                      <Link
                        to={`/product/${product.id}`}
                        onClick={() => trackEvent('homepage_featured_product_click', { productId: product.id, name: product.name })}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                      >
                        <ShoppingBag size={16} /> Szczegóły
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-[1.75rem] border border-primary/20 bg-primary/8 px-5 py-8 sm:rounded-[2rem] sm:px-8 sm:py-10 md:px-12 md:py-12">
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Potrzebujesz wsparcia przed zakupem?</h2>
                <p className="mb-6 max-w-2xl text-gray-300">
                  Sprawdź FAQ albo napisz na czacie. Pomożemy dobrać gatunek, terrarium i najważniejsze elementy wyposażenia.
                </p>
                <div className="flex flex-col gap-3 text-sm text-gray-200 sm:flex-row sm:flex-wrap">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Dobór pierwszego gatunku
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Lista wyposażenia
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Zasady dostawy
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:items-end">
                <Link to="/faq" className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 font-bold text-black transition-colors hover:bg-white sm:w-auto">
                  Zobacz FAQ
                </Link>
                <Link to="/contact" className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-8 py-4 font-bold text-white transition-colors hover:bg-white/5 sm:w-auto">
                  Kontakt do sklepu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
