import { test, expect } from '@playwright/test';

test.describe('VitaZone D2C Storefront E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage first
    await page.goto('/');
    
    // Inject cookie consent directly into localStorage to bypass the cookie banner
    await page.evaluate(() => {
      localStorage.setItem('cookie_consent', JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString()
      }));
    });
    
    // Reload or visit the page again to apply consent state
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
    
    // Search for an in-stock product (like "Gekon")
    const searchInput = page.locator('input[placeholder*="Szukaj"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Gekon');
    
    // Click the details link of the filtered in-stock product card
    const detailsLink = page.locator('text=Szczegóły →').first();
    await expect(detailsLink).toBeVisible();
    await detailsLink.click();
    
    // Wait for the product details page
    await page.waitForURL(/\/product\/.+/);
    
    // Click the add to cart button (should be enabled for in-stock gecko)
    const addToCartBtn = page.locator('button:has-text("Dodaj do koszyka")').first();
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();
    
    // Open the cart drawer manually by clicking the navbar shopping bag button
    const cartNavBtn = page.locator('button[aria-label^="Otwórz koszyk"]').first();
    await expect(cartNavBtn).toBeVisible();
    await cartNavBtn.click();
    
    // Verify the cart drawer opens
    const cartDrawerHeader = page.locator('h2:has-text("Koszyk"), h3:has-text("Koszyk"), :has-text("Twój koszyk")').first();
    await expect(cartDrawerHeader).toBeVisible();
  });

  test('should interact with the AI terrarium assistant', async ({ page }) => {
    // Check if the chat widget trigger button is present
    const chatTrigger = page.locator('button[aria-label*="czat"], button[aria-label*="Czat"]').first();
    await expect(chatTrigger).toBeVisible();
    
    // Open the chat widget (Cookie banner is dismissed, so it should not block)
    await chatTrigger.click();
    
    // Verify the assistant window is open
    const chatTitle = page.locator('h3:has-text("Asystent terrarystyki")');
    await expect(chatTitle).toBeVisible();
    
    // Send a message
    const chatInput = page.locator('input[placeholder*="Napisz"], input[placeholder*="wiadomość"]').first();
    const chatSubmitBtn = page.locator('button[aria-label="Wyślij wiadomość"]').first();
    await expect(chatInput).toBeVisible();
    await expect(chatSubmitBtn).toBeVisible();
    
    await chatInput.fill('Hi, recommend a reptile for a beginner');
    await chatSubmitBtn.click();
    
    // Check that our message appears in the conversation list
    const userMsg = page.locator('div:has-text("Hi, recommend a reptile for a beginner")').last();
    await expect(userMsg).toBeVisible();
    
    // Wait for the assistant reply bubble (which has the .justify-start layout class) to appear
    const assistantBubble = page.locator('.custom-scrollbar .justify-start').first();
    await expect(assistantBubble).toBeVisible({ timeout: 15000 });
  });

});
