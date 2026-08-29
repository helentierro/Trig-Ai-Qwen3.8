import { test, expect } from '@playwright/test';

test('arranca sin errores de consola y con el triángulo', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto('/');
  await expect(page.getByText('ÁLGEBRA')).toBeVisible();
  await expect(page.locator('[data-testid="pt-A"]')).toBeVisible();
  expect(errores).toEqual([]);
});

test('F1: arrastrar B conserva el ángulo recto (A sigue a B)', async ({ page }) => {
  await page.goto('/');
  const b = page.locator('[data-testid="pt-B"]');
  await expect(b).toBeVisible();
  const bb = await b.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb!.x - 120, bb!.y + bb!.height / 2, { steps: 12 });
  await page.mouse.up();
  const rowA = (await page.locator('[data-testid="row-A"]').textContent())!;
  const rowB = (await page.locator('[data-testid="row-B"]').textContent())!;
  const ax = Number(rowA.match(/\(([-\d.]+),/)![1]);
  const bx = Number(rowB.match(/\(([-\d.]+),/)![1]);
  expect(Math.abs(ax - bx)).toBeLessThan(0.01);
});

test('undo: crear punto y Ctrl+Z lo elimina', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('Crear punto (clic en el vacío)').click();
  await page.mouse.click(700, 300);
  await expect(page.locator('[data-testid="row-P1"]')).toBeVisible();
  await page.keyboard.press('Control+z');
  await expect(page.locator('[data-testid="row-P1"]')).toHaveCount(0);
});

test('mundo puente: la biblioteca carga la celosía', async ({ page }) => {
  await page.goto('/');
  await page.getByText('📚 Descubrir').click();
  await page.getByText('El puente de triángulos').click();
  await page.getByText('🎬 Entrar a este mundo').click();
  await expect(page.locator('[data-testid="row-b0"]')).toBeVisible();
});