import { test, expect } from '@playwright/test';

test.describe('Pixels Image Editor E2E', () => {
  test('complete creative editing workflow', async ({ page }) => {
    await page.goto('/');

    // 1. Welcome Screen is displayed
    await expect(page.locator('h1')).toHaveText('Pixels');
    await expect(page.getByText('Create New')).toBeVisible();

    // 2. Open sample project / preset
    await page.getByText('Square Graphic').click();

    // 3. Workspace renders with active document
    await expect(page.getByText('Social Post')).toBeVisible();
    await expect(page.getByText('Doc: 1080 × 1080 px')).toBeVisible();

    // 4. Layers panel shows initial Background layer
    await expect(page.getByText('Background')).toBeVisible();

    // 5. Select Brush Tool and draw on canvas
    await page.getByLabel('Brush Tool').click();
    const canvas = page.locator('main canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
      await page.mouse.up();
    }

    // 6. Add a new layer
    await page.getByTitle(/New Layer/i).click();
    await expect(page.getByText('Layer 2')).toBeVisible();

    // 7. Undo layer creation
    await page.getByLabel('Undo').click();
    await expect(page.getByText('Layer 2')).not.toBeVisible();

    // 8. Redo layer creation
    await page.getByLabel('Redo').click();
    await expect(page.getByText('Layer 2')).toBeVisible();

    // 9. Open Export Dialog
    await page.getByRole('button', { name: /Export/i }).click();
    await expect(page.getByText('Export Image')).toBeVisible();
    await expect(page.getByText('PNG (Lossless)')).toBeVisible();

    // Close Export Dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Export Image')).not.toBeVisible();
  });

  test('tool shortcuts and filter modal workflow', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Full HD Landscape').click();
    await expect(page.getByText('Landscape Photo')).toBeVisible();

    // Test tool hotkey 'E' for Eraser
    await page.keyboard.press('e');
    await expect(page.getByText(/Eraser Tool/i).first()).toBeVisible();

    // Test tool hotkey 'B' for Brush
    await page.keyboard.press('b');
    await expect(page.getByText(/Brush Tool/i).first()).toBeVisible();

    // Test Filter menu -> Gaussian Blur
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Gaussian Blur...' }).click();
    await expect(page.getByText('Blur Radius')).toBeVisible();

    // Apply Filter
    await page.getByRole('button', { name: 'Apply Filter' }).click();
    await expect(page.getByText('Blur Radius')).not.toBeVisible();
  });

  test('text layer creation and properties inspection', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Social Banner').click();
    await expect(page.getByText('Header Banner')).toBeVisible();

    // Switch to Text Tool
    await page.getByLabel('Text Tool').click();
    await page.getByRole('button', { name: /Add Text/i }).click();

    // Check layer list for Text Layer
    await expect(page.getByText('Double click to')).toBeVisible();

    // Check Properties Tab
    await page.getByRole('button', { name: 'Properties' }).click();
    await expect(page.getByText('Text Properties')).toBeVisible();
    await expect(page.getByText('Transform')).toBeVisible();
  });
});
