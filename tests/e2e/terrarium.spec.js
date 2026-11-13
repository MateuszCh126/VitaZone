import { expect, test } from '@playwright/test';

test('demo lets the user arrange real-scale sample products and prevents submission', async ({ page }) => {
  await page.route('**/api/terrarium/catalog', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] }) });
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
  });

  await page.goto('/terrarium');

  await expect(page.getByText('Podgląd demonstracyjny.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Urządź swoje terrarium' })).toBeVisible();
  await expect(page.getByText('Wnętrze 580 × 880 × 430 mm')).toBeVisible();
  await page.getByRole('button', { name: 'Dodaj Paproć tropikalna' }).click();
  await expect(page.getByText('1 obiekt')).toBeVisible();
  await expect(page.getByText('Wycena orientacyjna')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Wysyłka wyłączona w demo' })).toHaveAttribute('aria-disabled', 'true');
});

test('touch input and keyboard controls remain available when WebGL is unavailable', async ({ browser }) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (typeof type === 'string' && /webgl/i.test(type)) return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  await page.route('**/api/terrarium/catalog', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] }) });
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
  });

  await page.goto('/terrarium');
  await expect(page.getByText('Ta przeglądarka nie udostępnia WebGL.')).toBeVisible();
  const addFern = page.getByRole('button', { name: 'Dodaj Paproć tropikalna' });
  await addFern.tap();
  await expect(page.getByText('1 obiekt')).toBeVisible();
  const rotateButton = page.getByRole('button', { name: 'Obróć', exact: true });
  await rotateButton.focus();
  await page.keyboard.press('Enter');
  await expect(rotateButton).toHaveAttribute('aria-pressed', 'true');

  await context.close();
});

test('customer submits a real SKU layout, admin quotes it, and customer starts Stripe checkout', async ({ browser }) => {
  const enclosureId = '00000000-0000-4000-8000-000000000101';
  const plantId = '00000000-0000-4000-8000-000000000102';
  const projectId = '00000000-0000-4000-8000-000000000103';
  const model = (name) => ({ url: `/models/terrarium/${name}.glb`, version: '1' });
  const products = [
    {
      id: enclosureId, name: 'Terrarium testowe', price_cents: 12000, stock: 3, is_active: true,
      specs: { terrariumDesigner: {
        role: 'enclosure', shape: 'rectangular',
        dimensionsMm: { width: 400, height: 500, depth: 300 },
        innerDimensionsMm: { width: 380, height: 480, depth: 280 },
        allowedMountSurfaces: [], model: model('terrarium')
      } }
    },
    {
      id: plantId, name: 'Paproć testowa', species: 'Rośliny', price_cents: 1500, stock: 8, is_active: true,
      specs: { terrariumDesigner: {
        role: 'element', dimensionsMm: { width: 100, height: 120, depth: 100 },
        allowedMountSurfaces: ['floor'], model: model('paproc')
      } }
    }
  ];
  const customer = {
    id: '00000000-0000-4000-8000-000000000111', role: 'customer', name: 'Jan Kowalski',
    email: 'jan@example.test', country: 'Polska', city: 'Jelenia Góra',
    postalCode: '58-500', street: 'Kolejowa', houseNumber: '12'
  };
  const admin = { id: '00000000-0000-4000-8000-000000000112', role: 'admin', name: 'Administrator' };
  const workflow = { project: null, configuration: null, estimate: null, quote: null, checkoutPayload: null };

  const installRoutes = async (page, user) => {
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: user }));
    await page.route('**/api/terrarium/catalog', (route) => route.fulfill({ json: { products } }));
    await page.route('**/api/orders/user/**', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/cart', (route) => route.fulfill({ json: { items: [] } }));
    await page.route('**/api/categories', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/admin/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/terrarium/projects') && route.request().method() === 'GET') {
        const list = workflow.project ? [{
          id: projectId, status: workflow.project.status, created_at: new Date().toISOString(),
          estimate: workflow.estimate, estimate_total_cents: workflow.estimate.totalCents,
          quote: workflow.quote, quote_total_cents: workflow.quote?.totalCents || null
        }] : [];
        return route.fulfill({ json: list });
      }
      if (path.endsWith(`/terrarium/projects/${projectId}`) && route.request().method() === 'GET') {
        return route.fulfill({ json: {
          id: projectId, status: workflow.project?.status || 'submitted',
          created_at: new Date().toISOString(), customer_email: customer.email, customer_name: customer.name,
          configuration: workflow.configuration, estimate: workflow.estimate, quote: workflow.quote,
          quote_message: workflow.project?.quote_message || '', products
        } });
      }
      if (path.endsWith(`/terrarium/projects/${projectId}/quote`) && route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        workflow.quote = {
          currency: 'pln', items: workflow.estimate.items.map((item) => {
            const unitPriceCents = body.items.find((price) => price.productId === item.productId).unitPriceCents;
            return { ...item, unitPriceCents, lineTotalCents: unitPriceCents * item.quantity };
          })
        };
        workflow.quote.totalCents = workflow.quote.items.reduce((sum, item) => sum + item.lineTotalCents, 0);
        workflow.project.status = 'quoted';
        workflow.project.quote_message = body.message;
        return route.fulfill({ json: { id: projectId, status: 'quoted', quote: workflow.quote } });
      }
      if (path.endsWith('/stats')) return route.fulfill({ json: {} });
      return route.fulfill({ json: [] });
    });
    await page.route('**/api/terrarium/projects**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (path === '/api/terrarium/projects' && method === 'POST') {
        workflow.configuration = route.request().postDataJSON();
        workflow.estimate = {
          currency: 'pln',
          items: [
            { productId: enclosureId, name: 'Terrarium testowe', quantity: 1, unitPriceCents: 12000, lineTotalCents: 12000 },
            { productId: plantId, name: 'Paproć testowa', quantity: 1, unitPriceCents: 1500, lineTotalCents: 1500 }
          ],
          totalCents: 13500
        };
        workflow.project = { status: 'submitted' };
        return route.fulfill({ status: 201, json: { project: { id: projectId }, estimate: workflow.estimate } });
      }
      if (path === '/api/terrarium/projects' && method === 'GET') {
        const list = workflow.project ? [{
          id: projectId, status: workflow.project.status, created_at: new Date().toISOString(),
          estimate: workflow.estimate, estimate_total_cents: workflow.estimate.totalCents,
          quote: workflow.quote, quote_total_cents: workflow.quote?.totalCents || null
        }] : [];
        return route.fulfill({ json: list });
      }
      if (path === `/api/terrarium/projects/${projectId}/accept` && method === 'POST') {
        workflow.project.status = 'accepted';
        return route.fulfill({ json: { id: projectId, status: 'accepted' } });
      }
      if (path === `/api/terrarium/projects/${projectId}` && method === 'GET') {
        return route.fulfill({ json: {
          id: projectId, status: workflow.project?.status || 'quoted', created_at: new Date().toISOString(),
          configuration: workflow.configuration, estimate: workflow.estimate, quote: workflow.quote,
          quote_total_cents: workflow.quote?.totalCents, quote_expires_at: new Date(Date.now() + 86400000).toISOString(),
          shippingAmountCents: 1600, quote_message: workflow.project?.quote_message || '', products
        } });
      }
      return route.fulfill({ status: 404, json: { error: 'Unexpected test route' } });
    });
    await page.route('**/api/stripe/terrarium/projects/**', async (route) => {
      workflow.checkoutPayload = route.request().postDataJSON();
      return route.fulfill({ json: { sessionId: 'cs_test_terrarium', url: `${new URL(route.request().url()).origin}/__stripe_test__` } });
    });
    await page.route('**/__stripe_test__', (route) => route.fulfill({
      contentType: 'text/html', body: '<h1>Stripe test checkout</h1>'
    }));
  };

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  await installRoutes(customerPage, customer);
  await customerPage.goto('/terrarium');
  await customerPage.getByRole('button', { name: 'Dodaj Paproć testowa' }).click();
  await expect(customerPage.getByText(/135,00/)).toBeVisible();
  await expect(customerPage.getByRole('alert').getByText('Nie udało się wczytać modelu 3D.')).toBeVisible();
  await customerPage.getByRole('button', { name: 'Wyślij do wyceny' }).click();
  await expect(customerPage.getByText('Projekt zapisany.')).toBeVisible();
  expect(workflow.configuration.objects).toHaveLength(1);
  expect(workflow.configuration.objects[0]).not.toHaveProperty('price_cents');

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await installRoutes(adminPage, admin);
  await adminPage.goto('/admin?tab=terrarium');
  await expect(adminPage.getByRole('heading', { name: 'Oferta końcowa' })).toBeVisible();
  await adminPage.getByLabel('Cena końcowa za sztukę: Paproć testowa').fill('18.00');
  await adminPage.getByRole('button', { name: 'Wyślij ofertę klientowi' }).click();
  await expect(adminPage.getByRole('button', { name: 'Zaktualizuj ofertę' })).toBeVisible();
  expect(workflow.quote.totalCents).toBe(13800);

  await customerPage.goto('/dashboard?tab=terrarium');
  await customerPage.getByRole('link', { name: 'Sprawdź ofertę' }).click();
  await expect(customerPage.getByRole('heading', { name: 'Oferta na terrarium' })).toBeVisible();
  await customerPage.getByLabel('Akceptuję przedstawioną ofertę oraz ceny poszczególnych produktów.').check();
  await customerPage.getByLabel('Kod pocztowy').fill('58-500');
  await customerPage.getByLabel('Ulica').fill('Kolejowa');
  await customerPage.getByLabel('Numer domu').fill('12');
  await customerPage.getByRole('button', { name: 'Akceptuję ofertę i przechodzę do płatności' }).click();
  await expect(customerPage.getByRole('heading', { name: 'Stripe test checkout' })).toBeVisible();
  expect(workflow.project.status).toBe('accepted');
  expect(workflow.checkoutPayload.email).toBe(customer.email);

  await customerContext.close();
  await adminContext.close();
});
