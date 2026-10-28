import { test, expect } from '@playwright/test';
import { compressToEncodedURIComponent } from 'lz-string';
import {
  TEXT_INPUT_NAME,
  EMPTY_STATE_TEXT,
  openSidebar,
  fillTextarea,
  fillInput,
  clickInSidebar,
  outputField,
  generateFromText,
  blurActiveElement,
  waitForHydration,
  waitForAutoSave,
} from './utils';

test.describe('State persistence', () => {
  test('restores the last generated state after a reload', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'persist-across-reload');
    await expect(outputField(page)).toHaveValue('data:text/plain,persist-across-reload');

    // Auto-save is debounced; wait for the state to land in localStorage.
    const persisted = await waitForAutoSave(page);
    expect(persisted?.textInput).toBe('persist-across-reload');
    expect(persisted?.dataUri).toBe('data:text/plain,persist-across-reload');

    await page.reload();
    await openSidebar(page);

    await expect(page.getByRole('textbox', { name: TEXT_INPUT_NAME })).toHaveValue(
      'persist-across-reload',
      { timeout: 15000 }
    );
    await expect(outputField(page)).toHaveValue('data:text/plain,persist-across-reload');
  });

  test('restores the encoding and MIME options after a reload', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await page.getByRole('combobox', { name: 'MIME type' }).selectOption('image/svg+xml');
    await clickInSidebar(page, 'checkbox', 'Use base64 encoding');
    await fillTextarea(page, TEXT_INPUT_NAME, '<svg/>');
    await clickInSidebar(page, 'button', 'Generate Data URI');
    await expect(outputField(page)).toHaveValue(/^data:image\/svg\+xml;base64,/);

    await waitForAutoSave(page);
    await page.reload();
    await openSidebar(page);

    await expect(page.getByRole('combobox', { name: 'MIME type' })).toHaveValue('image/svg+xml', {
      timeout: 15000,
    });
    await expect(page.getByRole('checkbox', { name: 'Use base64 encoding' })).toBeChecked();
    await expect(outputField(page)).toHaveValue(/^data:image\/svg\+xml;base64,/);
  });

  test('loads a shared state from the URL query string', async ({ page }) => {
    const state = {
      inputMode: 'text',
      textInput: 'shared payload',
      fileName: '',
      selectedMimeType: 'text/plain',
      customMimeType: '',
      dataUri: 'data:text/plain,shared%20payload',
      isBase64: false,
      fileSize: 0,
      fileBytes: '',
      error: '',
      urlInput: '',
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(state));
    expect(encoded).toBeTruthy();

    await page.goto(`/?state=${encoded}&tool=data-uri-builder`);
    await expect(page.getByText('Loaded state from shared URL')).toBeVisible();
    await expect(outputField(page)).toHaveValue('data:text/plain,shared%20payload');
  });

  test('starts from an empty state when storage holds corrupt data', async ({ page }) => {
    await page.addInitScript(() => {
      // A non-JSON history payload must not break hydration.
      localStorage.setItem('itsjust:corrupt-ns:data-uri-builder', 'not-json{{');
      localStorage.setItem(
        'itsjust:history:corrupt-ns:data-uri-builder',
        '{"history": "not-an-array"}'
      );
    });

    await page.goto('/');
    await expect(page.getByRole('application', { name: 'Data URI Builder' })).toBeVisible();
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
  });
});

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
  });

  test('Ctrl+Z undoes and Ctrl+Y redoes the last edit', async ({ page }) => {
    await openSidebar(page);

    const textarea = page.getByRole('textbox', { name: TEXT_INPUT_NAME });
    await textarea.fill('edited');
    await expect(textarea).toHaveValue('edited');
    await blurActiveElement(page);

    await expect(page.getByRole('button', { name: /^Undo/ })).toBeEnabled();
    await page.keyboard.press('Control+z');
    await expect(textarea).toHaveValue('');

    await expect(page.getByRole('button', { name: /^Redo/ })).toBeEnabled();
    await page.keyboard.press('Control+y');
    await expect(textarea).toHaveValue('edited');
  });

  test('Ctrl+Shift+Z redoes after an undo', async ({ page }) => {
    await openSidebar(page);

    const textarea = page.getByRole('textbox', { name: TEXT_INPUT_NAME });
    await textarea.fill('shifted');
    await blurActiveElement(page);

    // Keyboard redo shortcut (Shift produces the uppercase key value).
    await page.keyboard.press('Control+z');
    await expect(textarea).toHaveValue('');

    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('z');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await expect(textarea).toHaveValue('shifted');
  });

  test('undo shortcut is left to the browser while typing in a text field', async ({ page }) => {
    await openSidebar(page);

    const textarea = page.getByRole('textbox', { name: TEXT_INPUT_NAME });
    await textarea.fill('typed value');

    // Inside a text field the global shortcut must not fire, so the browser's
    // native text undo stays available.
    const prevented = await textarea.evaluate((el) => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    });

    expect(prevented).toBe(false);
    await expect(textarea).toHaveValue('typed value');
  });

  test('Ctrl+S is intercepted so the browser save dialog never opens', async ({ page }) => {
    await generateFromText(page, 'save me');

    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });

    expect(prevented).toBe(true);
    // Nothing is lost: the generated URI stays on screen.
    await expect(outputField(page)).toHaveValue('data:text/plain,save%20me');
  });

  test('Ctrl+B toggles the options sidebar', async ({ page }) => {
    await openSidebar(page);

    const sidebar = page.locator('.tool-shell-sidebar');
    await expect(sidebar).toHaveClass(/open/);
    await blurActiveElement(page);

    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveClass(/collapsed/);

    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveClass(/open/);
  });

  test('Ctrl+Shift+C copies the generated data URI', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await generateFromText(page, 'shortcut copy');
    await blurActiveElement(page);

    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('c');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    await expect(page.getByText('Data URI copied to clipboard')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('data:text/plain,shortcut%20copy');
  });

  test('"? shows the keyboard shortcut overlay and Escape closes it', async ({ page }) => {
    await blurActiveElement(page);

    await page.keyboard.press('Shift+Slash');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Undo', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Toggle dark mode', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Ctrl+Z', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Delete clears the generated data URI', async ({ page }) => {
    await generateFromText(page, 'deletable');
    await blurActiveElement(page);

    await page.keyboard.press('Delete');

    await expect(outputField(page)).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
  });

  test('Ctrl+D toggles the dark theme', async ({ page }) => {
    await blurActiveElement(page);

    const root = page.locator('html');
    const initial = (await root.getAttribute('data-theme')) ?? 'light';
    const expected = initial === 'dark' ? 'light' : 'dark';

    await page.keyboard.press('Control+d');

    await expect(root).toHaveAttribute('data-theme', expected);
  });
});

test.describe('Theme persistence', () => {
  test('theme toggle survives a reload', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('html');
    const initial = (await root.getAttribute('data-theme')) ?? 'light';
    const target = initial === 'dark' ? 'light' : 'dark';

    await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
    await expect(root).toHaveAttribute('data-theme', target);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('itsjust-theme')))
      .toBe(target);

    await page.reload();
    await expect(root).toHaveAttribute('data-theme', target);
    await expect(page.getByRole('button', { name: /Switch to (dark|light) mode/ })).toBeVisible();
  });

  test('honors prefers-color-scheme when no theme is stored', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await context.close();
  });
});
