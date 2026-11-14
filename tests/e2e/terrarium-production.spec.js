import { expect, test } from '@playwright/test';

test('production build keeps the 3D runtime off the storefront and shows no demo SKUs when catalog is empty', async ({ page }) => {
  const scriptsLoaded = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.js') || response.url().includes('.js?')) scriptsLoaded.push(response.url());
  });
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' })
  }));
  await page.route('**/api/terrarium/catalog', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] })
  }));
  await page.route('**/api/products', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify([])
  }));

  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  expect(scriptsLoaded.some((url) => url.includes('TerrariumScene'))).toBe(false);

  await page.goto('/terrarium');
  await expect(page.getByRole('heading', { name: 'Konfigurator czeka na produkty' })).toBeVisible();
  await expect(page.getByText('Podgląd demonstracyjny.')).toHaveCount(0);
  await expect(page.getByText(/Gdy terraria i dodatki otrzymają rzeczywiste wymiary/)).toBeVisible();
  expect(scriptsLoaded.some((url) => url.includes('TerrariumScene'))).toBe(true);
});
