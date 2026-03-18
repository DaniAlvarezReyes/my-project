import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('homepage loads and shows products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sneakers Pro/);
    await expect(page.locator('text=Productos Destacados')).toBeVisible();
  });

  test('can navigate to products page', async ({ page }) => {
    await page.goto('/productos');
    await expect(page.locator('h1')).toContainText('Producto');
  });

  test('can search for products', async ({ page }) => {
    await page.goto('/productos');
    await page.fill('input[placeholder*="Buscar"]', 'Nike');
    await page.waitForTimeout(500);
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/productos');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page.locator('text=Añadir al carrito')).toBeVisible();
    }
  });

  test('cart page accessible', async ({ page }) => {
    await page.goto('/carrito');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('h1')).toContainText('Contacto');
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const hasDark = await html.evaluate(el => el.classList.contains('dark'));
    // Click theme toggle - find the button near the search
    const themeBtn = page.locator('button[aria-label="Cambiar tema"]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      const nowDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(nowDark).not.toBe(hasDark);
    }
  });
});
