import { test, expect } from '@playwright/test';

test.describe('VitaZone D2C Storefront E2E Tests', () => {
  
  test('should load the homepage and check elements', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation title / branding
    const headerBranding = page.locator('header a, nav a').first();
    await expect(headerBranding).toContainText(/VitaZone/i);
    
    // Check home page sections
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toBeVisible();
  });

  test('should navigate to shop and add a product to the cart', async ({ page }) => {
    await page.goto('/shop');
    
    // Wait for product cards to load
    const firstProductCard = page.locator('[data-testid="product-card"]').first();
    // Fallback if data-testid is not present: look for cards or buttons containing Add to Cart / koszyk
    const addToCartBtn = page.locator('button:has-text("Do koszyka"), button:has-text("Kup teraz")').first();
    
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    // Check if the cart drawer opens and lists the item
    const cartDrawerHeader = page.locator('h2:has-text("Koszyk"), h3:has-text("Koszyk"), :has-text("Twój koszyk")').first();
    await expect(cartDrawerHeader).toBeVisible();
  });

  test('should interact with the AI terrarium assistant', async ({ page }) => {
    await page.goto('/');
    
    // Check if the chat widget trigger button is present
    const chatTrigger = page.locator('button[aria-label*="czat"], button[aria-label*="Czat"]').first();
    await expect(chatTrigger).toBeVisible();
    
    // Open the chat widget
    await chatTrigger.click();
    
    // Verify the assistant window is open
    const chatTitle = page.locator('h3:has-text("Asystent terrarystyki")');
    await expect(chatTitle).toBeVisible();
    
    // Send a message
    const chatInput = page.locator('input[placeholder*="Napisz"], input[placeholder*="wiadomość"]').first();
    await expect(chatInput).toBeVisible();
    
    await chatInput.fill('Hi, recommend a reptile for a beginner');
    await chatInput.press('Enter');
    
    // Check that our message appears in the conversation list
    const userMsg = page.locator('div:has-text("Hi, recommend a reptile for a beginner")').last();
    await expect(userMsg).toBeVisible();
    
    // Wait for the loader to disappear and assistant reply to appear
    const assistantMsg = page.locator('div:has-text("Asystent terrarystyki")').last();
    // Let's wait up to 10 seconds for the Gemini API call to return
    await expect(page.locator('form ~ div, .custom-scrollbar').locator('div:has-text("Leopard")').or(page.locator('.custom-scrollbar').locator('div:has-text("gecko")')).or(page.locator('.custom-scrollbar').locator('div:has-text("snake")')).or(page.locator('.custom-scrollbar').locator('div:has-text("Hello")')).first()).toBeVisible({ timeout: 15000 });
  });

});
