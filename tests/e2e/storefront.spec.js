import { test, expect } from '@playwright/test';

const demoProduct = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Terrarium demonstracyjne',
  price: 249,
  stock: 3,
  category_name: 'Terraria i zestawy',
  species: '',
  description: 'Dane demonstracyjne używane wyłącznie w lokalnych testach interfejsu.',
  image_urls: ['/hero-bg-1280.avif'],
  is_active: true,
  created_at: '2020-01-01T00:00:00.000Z'
};

test.describe('VitaZone storefront (demo data)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.location.search.includes('consent-test')) {
        localStorage.setItem('cookie_consent_v1', JSON.stringify({
          necessary: true,
          analytics: true,
          timestamp: new Date().toISOString()
        }));
      }
    });

    await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }));
    await page.route('**/api/consent', (route) => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/stripe/config', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ shippingAmountCents: 1500 })
    }));
    await page.route('**/api/products**', async (route) => {
      if (new URL(page.url()).searchParams.has('catalog-error-test')) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Demo catalog failure' })
        });
        return;
      }

      const url = new URL(route.request().url());
      const isProductDetail = url.pathname.endsWith(`/api/products/${demoProduct.id}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isProductDetail ? demoProduct : [demoProduct])
      });
    });
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'To odpowiedź demonstracyjna oparta na informacjach z testowego katalogu.' })
      });
    });
  });

  test('shows both shopping journeys and the main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Urządzam pierwsze terrarium/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mam już zwierzę/ })).toBeVisible();
  });

  test('labels account fields and connects validation errors to their inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Adres email')).toBeVisible();
    await expect(page.getByLabel('Hasło')).toBeVisible();

    await page.goto('/register');
    await expect(page.getByLabel('Imię')).toBeVisible();
    await expect(page.getByLabel('Nazwisko')).toBeVisible();
    await expect(page.getByLabel('Adres email')).toBeVisible();
    await page.getByRole('button', { name: /Zarejestruj się/ }).click();

    await expect(page.getByLabel('Nazwisko')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Nazwisko')).toHaveAttribute('aria-describedby', 'register-last-name-error');
    await expect(page.locator('#register-last-name-error')).toHaveAttribute('role', 'alert');
    await expect(page.getByLabel(/Oświadczam, że mam ukończone 18 lat/)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#register-age-error')).toHaveAttribute('role', 'alert');
  });

  test('finds a demo product, opens its details, and adds it to the cart', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('aside').getByPlaceholder('Szukaj produktu lub gatunku').fill('Terrarium demonstracyjne');

    await expect(page.getByRole('status')).toContainText('Znaleziono 1 produkt');
    await page.getByRole('link', { name: /Szczegóły/ }).click();
    await expect(page).toHaveURL(new RegExp(`/product/${demoProduct.id}`));
    await expect(page.getByRole('heading', { name: demoProduct.name })).toBeVisible();
    await page.getByRole('button', { name: `Dodaj produkt ${demoProduct.name} do koszyka` }).click();

    await page.getByRole('button', { name: /Otwórz koszyk/ }).click();
    await expect(page.getByRole('dialog', { name: /Twój koszyk/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Twój koszyk/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: demoProduct.name, level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zamknij koszyk' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Twój koszyk/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Otwórz koszyk/ })).toBeFocused();
  });

  test('explains an empty search result and offers a direct filter reset', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('aside').getByPlaceholder('Szukaj produktu lub gatunku').fill('fraza bez wyników');

    await expect(page.getByRole('heading', { name: 'Brak produktów dla wybranych filtrów' })).toBeVisible();
    await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
    await expect(page.getByRole('status')).toContainText('Znaleziono 1 produkt');
  });

  test('shows one actionable catalog error instead of duplicating an empty state', async ({ page }) => {
    await page.goto('/shop?catalog-error-test');

    await expect(page.getByRole('alert')).toContainText('Nie udało się pobrać pełnej oferty');
    await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Oferta chwilowo niedostępna' })).toHaveCount(0);
  });

  test('renders every application route at a narrow viewport without a React crash', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });

    const routes = [
      '/',
      '/shop',
      `/product/${demoProduct.id}`,
      '/about',
      '/contact',
      '/faq',
      '/terms',
      '/privacy',
      '/cookies',
      '/withdrawal',
      '/login',
      '/register',
      '/checkout',
      '/dashboard',
      '/admin',
      '/not-a-real-route'
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }

    expect(pageErrors).toEqual([]);
  });

  test('does not show live-animal withdrawal guidance in an accessory-only cart', async ({ page }) => {
    await page.goto(`/product/${demoProduct.id}`);
    await page.getByRole('button', { name: `Dodaj produkt ${demoProduct.name} do koszyka` }).click();
    await page.getByRole('button', { name: /Otwórz koszyk/ }).click();

    await expect(page.getByText(/Przed zakupem żywego zwierzęcia/)).toHaveCount(0);
    await expect(page.getByText(/dla żywych zwierząt nie obowiązuje standardowy zwrot/)).toHaveCount(0);
  });

  test('completes the guest checkout handoff without trusting browser identity', async ({ page }) => {
    let checkoutPayload;
    await page.route('**/api/shipping/quotes', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ quotes: [{ method: 'inpost', label: 'InPost', amountCents: 1500, currency: 'pln' }] })
    }));
    await page.route('**/api/stripe/create-checkout-session', async (route) => {
      checkoutPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'cs_test_demo1234567890', url: '/mock-stripe-checkout' })
      });
    });
    await page.goto(`/product/${demoProduct.id}`);
    await page.getByRole('button', { name: 'Dodaj produkt Terrarium demonstracyjne do koszyka' }).click();
    await page.getByRole('button', { name: /Otwórz koszyk/ }).click();
    await page.getByRole('dialog', { name: /Twój koszyk/ }).getByRole('button', { name: 'Przejdź do płatności' }).click();

    await expect(page.getByRole('heading', { name: 'Finalizacja zamówienia' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dane dostawy' })).toHaveAttribute('aria-current', 'step');
    await expect(page.getByLabel('Adres e-mail')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('Kod pocztowy')).toHaveAttribute('autocomplete', 'postal-code');
    await expect(page.getByText(/Przy wycenie kosztu dostawy Furgonetka otrzyma dane odbiorcy/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Informacje o danych' })).toHaveAttribute('href', '/privacy');
    await page.getByLabel('Imię i nazwisko').fill('Jan Kowalski');
    await page.getByLabel('Adres e-mail').fill('jan@example.com');
    await page.getByLabel('Telefon do dostawy').fill('500600700');
    await page.getByLabel('Kraj').fill('Polska');
    await page.getByLabel('Miasto').fill('Warszawa');
    await page.getByLabel('Kod pocztowy').fill('00-001');
    await page.getByLabel('Ulica').fill('Testowa');
    await page.getByLabel('Numer domu').fill('1');
    await page.getByRole('main').getByRole('button', { name: 'Sprawdź metody i koszt dostawy' }).click();
    await page.getByRole('radio', { name: /InPost/ }).check();
    await expect(page.getByRole('group').getByText('15.00 zł')).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Przejdź do płatności' }).click();
    await expect(page.getByRole('heading', { name: 'Płatność' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Płatność' })).toHaveAttribute('aria-current', 'step');
    await page.getByRole('button', { name: 'Przejdź do Stripe Checkout' }).click();
    await expect(page.getByLabel(/Oświadczam, że mam ukończone 18 lat/)).toBeFocused();
    await expect(page.getByText('Zaznacz to oświadczenie, aby przejść do płatności.', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/Oświadczam, że mam ukończone 18 lat/)).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel(/Oświadczam, że mam ukończone 18 lat/).check();
    await page.getByRole('button', { name: 'Przejdź do Stripe Checkout' }).click();

    await expect(page).toHaveURL(/\/mock-stripe-checkout$/);
    expect(checkoutPayload).toMatchObject({
      items: [{ productId: demoProduct.id, quantity: 1 }],
      shipping: { email: 'jan@example.com', phone: '500600700', postal_code: '00-001' },
      deliveryMethod: 'inpost',
      expectedShippingAmountCents: 1500
    });
    expect(checkoutPayload).not.toHaveProperty('userId');
  });

  test('explains the chat scope and displays its response', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Otwórz czat' }).click();

    await expect(page.getByText('Informacje o ofercie sklepu')).toBeVisible();
    await expect(page.getByText(/nie zastępuje lekarza weterynarii/)).toBeVisible();
    await page.getByLabel('Wiadomość do asystenta').fill('Pokaż informacje o terrarium');
    await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();
    await expect(page.getByText(/To odpowiedź demonstracyjna/)).toBeVisible();
  });

  test('stores a refusal of optional analytics', async ({ page }) => {
    const optionalScriptRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('va.vercel-scripts.com/v1/')) optionalScriptRequests.push(request.url());
    });
    await page.goto('/?consent-test');
    await page.getByRole('button', { name: 'Odrzuć analitykę' }).click();

    await expect(page.getByRole('region', { name: 'Ustawienia cookies' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ustawienia prywatności' })).toBeFocused();
    const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('cookie_consent_v1')));
    expect(consent).toMatchObject({ necessary: true, analytics: false });
    expect(consent).not.toHaveProperty('marketing');
    expect(optionalScriptRequests).toEqual([]);
    await expect(page.locator('script[src*="vercel-scripts.com"]')).toHaveCount(0);
  });

  test('lets a visitor reopen privacy settings after saving a choice', async ({ page }) => {
    await page.goto('/?consent-test');
    await page.getByRole('button', { name: 'Odrzuć analitykę' }).click();
    await page.getByRole('button', { name: 'Ustawienia prywatności' }).click();
    await expect(page.getByRole('heading', { name: 'Ustawienia prywatności' })).toBeFocused();
    await page.getByRole('button', { name: 'Wróć do wyboru zgody' }).click();
    await expect(page.getByRole('button', { name: 'Odrzuć analitykę' })).toBeFocused();
    await page.getByRole('button', { name: 'Dostosuj' }).click();
    await expect(page.getByLabel(/Analityka Vercel/)).not.toBeChecked();
    await page.getByLabel(/Analityka Vercel/).check();
    await page.getByRole('button', { name: 'Zapisz wybór' }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cookie_consent_v1'))?.analytics)).toBe(true);
    await expect(page.getByRole('button', { name: 'Ustawienia prywatności' })).toBeFocused();
  });

  test('loads optional analytics scripts only after consent is accepted', async ({ page }) => {
    const optionalScriptRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('va.vercel-scripts.com/v1/')) optionalScriptRequests.push(request.url());
    });
    await page.route('https://va.vercel-scripts.com/v1/**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.__vercelConsentScriptLoaded = true;'
    }));
    await page.goto('/?consent-test');
    await page.getByRole('button', { name: 'Akceptuj analitykę' }).click();

    await expect.poll(() => optionalScriptRequests.length).toBe(2);
    expect(optionalScriptRequests).toEqual(expect.arrayContaining([
      expect.stringContaining('/v1/script.debug.js'),
      expect.stringContaining('/v1/speed-insights/script.debug.js')
    ]));
  });

  test('keeps the primary shopping choices visible on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Urządzam pierwsze terrarium/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mam już zwierzę/ })).toBeVisible();
    const menuToggle = page.getByRole('button', { name: 'Otwórz menu' });
    await expect(menuToggle).toHaveAttribute('aria-controls', 'mobile-navigation');
    await expect(page.locator('#mobile-navigation')).toHaveAttribute('inert', '');
    await menuToggle.click();
    await expect(page.getByRole('dialog', { name: 'Menu główne' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zamknij menu mobilne' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: 'Logowanie' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu główne' })).toHaveCount(0);
    await expect(menuToggle).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto('/shop');
    await expect(page.getByText('1 produkt w katalogu')).toBeVisible();
    const filterToggle = page.getByRole('button', { name: 'Pokaż filtry' });
    await expect(filterToggle).toHaveAttribute('aria-controls', 'mobile-product-filters');
    await expect(page.locator('#mobile-product-filters')).toHaveAttribute('inert', '');
    await expect(filterToggle).toHaveAttribute('aria-expanded', 'false');
    await filterToggle.click();
    await expect(page.getByRole('button', { name: 'Ukryj filtry' })).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#mobile-product-filters').getByLabel('Szukaj produktu lub gatunku').fill('Terrarium demonstracyjne');
    await expect(page.getByRole('status')).toContainText('Znaleziono 1 produkt');
    await page.getByRole('link', { name: /Szczegóły/ }).click();
    await page.getByRole('button', { name: `Dodaj produkt ${demoProduct.name} do koszyka` }).click();
    await page.getByRole('button', { name: /Otwórz koszyk/ }).click();
    await expect(page.getByRole('dialog', { name: /Twój koszyk/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('reflows shopping and checkout at 200-percent equivalent and phone widths', async ({ page }) => {
    for (const width of [720, 360]) {
      await page.setViewportSize({ width, height: 450 });
      const hasNoHorizontalOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

      await page.goto('/shop');
      await expect.poll(hasNoHorizontalOverflow).toBe(true);
      await page.getByRole('button', { name: 'Pokaż filtry' }).click();
      await page.locator('#mobile-product-filters').getByLabel('Szukaj produktu lub gatunku').fill('Terrarium demonstracyjne');
      await page.getByRole('link', { name: /Szczegóły/ }).click();
      await expect(page.getByRole('heading', { name: demoProduct.name })).toBeVisible();
      await expect.poll(hasNoHorizontalOverflow).toBe(true);

      await page.getByRole('button', { name: `Dodaj produkt ${demoProduct.name} do koszyka` }).click();
      await page.getByRole('button', { name: /Otwórz koszyk/ }).click();
      await expect(page.getByRole('dialog', { name: /Twój koszyk/ })).toBeVisible();
      await expect.poll(hasNoHorizontalOverflow).toBe(true);
      await page.getByRole('dialog', { name: /Twój koszyk/ }).getByRole('button', { name: 'Przejdź do płatności' }).click();
      await expect(page.getByRole('heading', { name: 'Podsumowanie zamówienia' })).toBeVisible();
      await expect.poll(hasNoHorizontalOverflow).toBe(true);
    }
  });
});
