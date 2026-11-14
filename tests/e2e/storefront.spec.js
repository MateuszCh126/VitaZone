import { test, expect } from '@playwright/test';

const demoProduct = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Terrarium demonstracyjne dla gekona',
  price: 249,
  stock: 3,
  category_name: 'Terraria i zestawy',
  species: '',
  description: 'Dane demonstracyjne używane wyłącznie w lokalnych testach interfejsu.',
  image_urls: ['/hero-bg-1280.avif'],
  is_active: true,
  created_at: '2020-01-01T00:00:00.000Z'
};

test.describe('VitaZone D2C Storefront E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent_v1', JSON.stringify({
        necessary: true,
        analytics: true,
        timestamp: new Date().toISOString()
      }));
    });

    await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }));
    await page.route('**/api/consent', (route) => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/stripe/config', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ shippingAmountCents: 1500 })
    }));
    await page.route('**/api/products**', async (route) => {
      const url = new URL(route.request().url());
      const isProductDetail = url.pathname.endsWith(`/api/products/${demoProduct.id}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isProductDetail ? demoProduct : [demoProduct])
      });
    });
    await page.route('**/api/chat', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'To odpowiedź demonstracyjna oparta na informacjach z testowego katalogu.' })
    }));

    await page.goto('/');
  });
  
  test('should load the homepage and check elements', async ({ page }) => {
    // Check navigation title / branding
    const headerBranding = page.locator('header a, nav a').first();
    await expect(headerBranding).toContainText(/VitaZone/i);
    
    // Check home page sections
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toBeVisible();
  });

  test('should navigate to shop and add a product to the cart', async ({ page }) => {
    await page.goto('/shop');
    
    const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Gekon');
    
    const detailsLink = page.locator('text=Szczegóły →').first();
    await expect(detailsLink).toBeVisible();
    await detailsLink.click();
    
    await page.waitForURL(/\/product\/.+/);
    
    const addToCartBtn = page.locator('button:has-text("Dodaj do koszyka")').first();
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();
    
    const cartNavBtn = page.locator('button[aria-label^="Otwórz koszyk"]').first();
    await expect(cartNavBtn).toBeVisible();
    await cartNavBtn.click();
    
    const cartDrawerHeader = page.locator('h2:has-text("Koszyk"), h3:has-text("Koszyk"), :has-text("Twój koszyk")').first();
    await expect(cartDrawerHeader).toBeVisible();
  });

  test('should interact with the AI terrarium assistant', async ({ page }) => {
    const chatTrigger = page.locator('button[aria-label*="czat"], button[aria-label*="Czat"]').first();
    await expect(chatTrigger).toBeVisible();
    
    await chatTrigger.click();
    
    const chatTitle = page.locator('h3:has-text("Asystent terrarystyki")');
    await expect(chatTitle).toBeVisible();
    
    const chatInput = page.locator('input[placeholder*="Napisz"], input[placeholder*="wiadomość"]').first();
    const chatSubmitBtn = page.locator('button[aria-label="Wyślij wiadomość"]').first();
    await expect(chatInput).toBeVisible();
    await expect(chatSubmitBtn).toBeVisible();
    
    await chatInput.fill('Hi, recommend a reptile for a beginner');
    await chatSubmitBtn.click();
    
    const userMsg = page.locator('div:has-text("Hi, recommend a reptile for a beginner")').last();
    await expect(userMsg).toBeVisible();
    
    const assistantBubble = page.locator('.custom-scrollbar .justify-start').first();
    await expect(assistantBubble).toBeVisible({ timeout: 15000 });
  });

});
