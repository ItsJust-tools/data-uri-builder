import { test, expect } from '@playwright/test';

test.describe('Data URI Builder E2E', () => {
  test('renders the tool with default content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveText('loading...', { timeout: 10000 });
    await expect(page.getByRole('application', { name: 'Data URI Builder' })).toBeVisible();
  });

  test('generates data URI from text input', async ({ page }) => {
    await page.goto('/');

    // Type text content
    const textarea = page.locator('textarea[aria-label="Text input"]');
    await textarea.fill('Hello World');
    await expect(textarea).toHaveValue('Hello World');

    // Click generate button
    await page.getByRole('button', { name: 'Generate Data URI' }).click();

    // Check that data URI appears
    const output = page.locator('textarea[aria-label="Generated data URI"]');
    await expect(output).toBeVisible();
    await expect(output).toHaveValue(/^data:/);
  });

  test('switches between input modes', async ({ page }) => {
    await page.goto('/');

    // Click file tab
    await page.getByRole('tab', { name: 'file input' }).click();
    await expect(page.locator('text=Click to choose a file')).toBeVisible();

    // Click URL tab
    await page.getByRole('tab', { name: 'url input' }).click();
    await expect(page.getByPlaceholder('https://example.com/image.png')).toBeVisible();

    // Click text tab
    await page.getByRole('tab', { name: 'text input' }).click();
    await expect(page.locator('textarea[aria-label="Text input"]')).toBeVisible();
  });

  test('allows copying data URI to clipboard', async ({ page }) => {
    await page.goto('/');

    // Type text and generate
    await page.locator('textarea[aria-label="Text input"]').fill('Test copy');
    await page.getByRole('button', { name: 'Generate Data URI' }).click();

    // Click copy button
    await page.getByRole('button', { name: 'Copy data URI to clipboard' }).click();
  });

  test('allows toggling base64 encoding', async ({ page }) => {
    await page.goto('/');

    // Enable base64
    await page.getByRole('checkbox', { name: 'Use base64 encoding' }).check();

    // Type text and generate
    await page.locator('textarea[aria-label="Text input"]').fill('Test');
    await page.getByRole('button', { name: 'Generate Data URI' }).click();

    // Check data URI exists
    const output = page.locator('textarea[aria-label="Generated data URI"]');
    await expect(output).toBeVisible();
  });
});
