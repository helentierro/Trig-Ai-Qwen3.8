// tests/algebra.spec.ts — Playwright: el panel álgebra es vivo y editable (bug Fase H)
import { test, expect } from '@playwright/test';

test('álgebra viva: arrastrar A actualiza el panel al instante', async ({ page }) => {
  await page.goto('/');
  const rowA = page.locator('[data-testid="row-A"]');
  const before = await rowA.textContent();
  const pt = page.locator('[data-testid="pt-A"]');
  const box = (await pt.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y - 60, { steps: 6 });
  await page.mouse.up();
  const after = await rowA.textContent();
  expect(after).not.toBe(before);
});

test('álgebra editable: escribir coordenadas mueve el punto', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="val-B"]').click();
  await page.locator('[data-testid="edit-B"]').fill('80, 0');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="row-B"]')).toContainText('(80, 0)');
});