import { test, expect } from '@playwright/test';
import {
  TEXT_INPUT_NAME,
  EMPTY_STATE_TEXT,
  openSidebar,
  fillTextarea,
  fillInput,
  clickInSidebar,
  outputField,
  generateFromText,
} from './utils';

test.describe('Data URI Builder E2E', () => {
  test('renders the tool with default content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveText('loading...', { timeout: 10000 });
    await expect(page.getByRole('application', { name: 'Data URI Builder' })).toBeVisible();
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
  });

  test('generates data URI from text input', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    const textarea = page.getByRole('textbox', { name: TEXT_INPUT_NAME });
    await fillTextarea(page, TEXT_INPUT_NAME, 'Hello World');
    await expect(textarea).toHaveValue('Hello World');

    await clickInSidebar(page, 'button', 'Generate Data URI');

    const output = outputField(page);
    await expect(output).toBeVisible();
    await expect(output).toHaveValue('data:text/plain,Hello%20World');
    await expect(page.locator('.status-slot-length')).toHaveText(
      `${'data:text/plain,Hello%20World'.length} chars`
    );
  });

  test('validates empty text input instead of generating', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    const generate = page.getByRole('button', { name: 'Generate Data URI' });
    await expect(generate).toBeDisabled();
    await expect(outputField(page)).toHaveCount(0);
  });

  test('switches between input modes', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await clickInSidebar(page, 'tab', 'file input');
    await expect(page.getByText(/Click or drag to choose a file/i)).toBeVisible();

    await clickInSidebar(page, 'tab', 'url input');
    await expect(page.getByPlaceholder('https://example.com/image.png')).toBeVisible();
    // URL mode never produces a client-side fetch; it explains the CORS limit instead.
    await expect(page.getByRole('status').filter({ hasText: 'URL mode' })).toBeVisible();

    await clickInSidebar(page, 'tab', 'text input');
    await expect(page.getByRole('textbox', { name: TEXT_INPUT_NAME })).toBeVisible();
  });

  test('applies the selected MIME type and base64 encoding', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await page.getByRole('combobox', { name: 'MIME type' }).selectOption('application/json');
    await clickInSidebar(page, 'checkbox', 'Use base64 encoding');
    await fillTextarea(page, TEXT_INPUT_NAME, '{"a":1}');
    await clickInSidebar(page, 'button', 'Generate Data URI');

    // base64 of {"a":1}
    await expect(outputField(page)).toHaveValue('data:application/json;base64,eyJhIjoxfQ==');
    await expect(page.getByText('Base64 encoded')).toBeVisible();
  });

  test('honors a custom MIME type', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await page.getByRole('combobox', { name: 'MIME type' }).selectOption('custom');
    await fillInput(page, 'Custom MIME type', 'text/markdown');
    await expect(page.getByRole('textbox', { name: 'Custom MIME type' })).toHaveValue(
      'text/markdown'
    );
    await generateFromText(page, 'typed text');

    await expect(outputField(page)).toHaveValue('data:text/markdown,typed%20text');
    await expect(page.locator('.status-slot-mime')).toHaveText('text/markdown');
  });

  test('clears the generated data URI', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'temporary');

    await openSidebar(page);
    await page.getByRole('button', { name: 'Clear and start over' }).click();

    await expect(outputField(page)).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEXT_INPUT_NAME })).toHaveValue('');
  });

  test('allows copying data URI to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await generateFromText(page, 'Test copy');

    await page
      .getByRole('application', { name: 'Data URI Builder' })
      .getByRole('button', { name: 'Copy data URI to clipboard' })
      .click();

    await expect(page.getByText('Data URI copied to clipboard')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('data:text/plain,Test%20copy');
  });

  test('allows toggling base64 encoding', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await clickInSidebar(page, 'checkbox', 'Use base64 encoding');

    await fillTextarea(page, TEXT_INPUT_NAME, 'Test');
    await clickInSidebar(page, 'button', 'Generate Data URI');

    const output = outputField(page);
    await expect(output).toBeVisible();
    await expect(output).toHaveValue(/^data:text\/plain;base64,/);
  });
});
