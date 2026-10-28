import { test, expect, type Download } from '@playwright/test';
import {
  TEXT_INPUT_NAME,
  EMPTY_STATE_TEXT,
  openSidebar,
  outputField,
  generateFromText,
  clickInSidebar,
  waitForHydration,
} from './utils';

const VALID_STATE = {
  inputMode: 'text',
  textInput: 'imported payload',
  fileName: '',
  selectedMimeType: 'text/plain',
  customMimeType: '',
  dataUri: 'data:text/plain,imported%20payload',
  isBase64: false,
  fileSize: 0,
  fileBytes: '',
  error: '',
  urlInput: '',
};

async function downloadPayload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  let body = '';
  for await (const chunk of stream) body += chunk.toString();
  return body;
}

/** Opens the export dropdown and chooses a format. */
async function exportAs(page: Parameters<typeof generateFromText>[0], label: RegExp | string) {
  await page.getByRole('button', { name: 'Export' }).first().click();
  const option = page.getByRole('option', { name: label });
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await option.getByRole('button').click();
  return downloadPromise;
}

test.describe('Export', () => {
  test('exports the full state as JSON', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'export-me');

    const download = await exportAs(page, /JSON Data/);
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    const payload = JSON.parse(await downloadPayload(download));
    expect(payload).toMatchObject({
      inputMode: 'text',
      textInput: 'export-me',
      selectedMimeType: 'text/plain',
      dataUri: 'data:text/plain,export-me',
      isBase64: false,
      urlInput: '',
    });
    await expect(page.getByText('Exported as .json')).toBeVisible();
  });

  test('exports the canvas as PNG', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'png export');

    const download = await exportAs(page, /PNG Image/);
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const buffer = Buffer.concat(chunks);

    // PNG magic number
    expect(buffer.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    await expect(page.getByText('Exported as .png')).toBeVisible();
  });

  test('offers every configured export format', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'formats');

    await page.getByRole('button', { name: 'Export' }).first().click();
    const listbox = page.getByRole('listbox', { name: 'Export' });
    await expect(listbox).toBeVisible();

    const labels = ['JSON Data', 'PNG Image', 'JPEG Image', 'WebP Image', 'PDF Document'];
    await expect(listbox.getByRole('option')).toHaveCount(labels.length);
    for (const label of labels) {
      await expect(listbox.getByRole('option', { name: new RegExp(label) })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
  });

  test('JSON export payload round-trips back through import', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'round trip');
    const download = await exportAs(page, /JSON Data/);
    const payload = await downloadPayload(download);

    await page.goto('/');
    await waitForHydration(page);
    await openSidebar(page);
    await page.locator('.import-export-group input[type=file]').setInputFiles({
      name: 'state.json',
      mimeType: 'application/json',
      buffer: Buffer.from(payload),
    });

    await expect(page.getByText('Imported state')).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEXT_INPUT_NAME })).toHaveValue('round trip');
    await expect(outputField(page)).toHaveValue('data:text/plain,round%20trip');
  });
});

test.describe('Import and drag-and-drop', () => {
  test('imports a valid state file', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await openSidebar(page);

    await page.locator('.import-export-group input[type=file]').setInputFiles({
      name: 'state.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(VALID_STATE)),
    });

    await expect(page.getByText('Imported state')).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEXT_INPUT_NAME })).toHaveValue(
      'imported payload'
    );
    await expect(outputField(page)).toHaveValue('data:text/plain,imported%20payload');
  });

  test('surfaces an error for a corrupted JSON file and keeps prior state', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'keep me');

    await page.locator('.import-export-group input[type=file]').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ this is not json'),
    });

    const toast = page.locator('.toast-error');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/Unexpected|token|JSON/i);
    // Previous work is untouched by a failed import.
    await expect(outputField(page)).toHaveValue('data:text/plain,keep%20me');
  });

  test('rejects a state file whose shape does not match the tool', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await openSidebar(page);

    await page.locator('.import-export-group input[type=file]').setInputFiles({
      name: 'wrong.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ unrelated: true })),
    });

    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page.getByText(/Invalid data format/)).toBeVisible();
    await expect(outputField(page)).toHaveCount(0);
  });

  test('dropping a file anywhere on the page switches to file mode and converts it', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForHydration(page);

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['dropped content'], 'notes.txt', { type: 'text/plain' }));
      return dt;
    });

    await page.dispatchEvent('#tool-canvas', 'dragenter', { dataTransfer });
    await expect(page.getByRole('status', { name: 'Drop file here' })).toBeVisible();

    await page.dispatchEvent('#tool-canvas', 'drop', { dataTransfer });

    await expect(page.getByText('File dropped: notes.txt')).toBeVisible();
    await openSidebar(page);
    await expect(page.getByRole('tab', { name: 'file input' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.locator('.file-upload-text')).toHaveText('notes.txt');

    await clickInSidebar(page, 'button', 'Generate data URI');
    await expect(outputField(page)).toHaveValue(
      `data:text/plain;base64,${Buffer.from('dropped content').toString('base64')}`
    );
  });

  test('a dropped file with an unknown extension falls back to the current MIME type', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForHydration(page);

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['%PDF-1.4 fake'], 'document.unknownext'));
      return dt;
    });
    await page.dispatchEvent('#tool-canvas', 'drop', { dataTransfer });
    await openSidebar(page);

    await expect(page.locator('.file-upload-text')).toHaveText('document.unknownext');
    await clickInSidebar(page, 'button', 'Generate data URI');
    await expect(outputField(page)).toHaveValue(/^data:text\/plain;base64,/);
  });

  test('clearing after a drop returns to the empty state', async ({ page }) => {
    await page.goto('/');
    await generateFromText(page, 'before drop');
    await waitForHydration(page);

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['binary-ish'], 'sample.bin', { type: 'application/octet-stream' }));
      return dt;
    });
    await page.dispatchEvent('#tool-canvas', 'drop', { dataTransfer });
    await openSidebar(page);
    await clickInSidebar(page, 'button', 'Generate data URI');
    await expect(outputField(page)).toBeVisible();

    await page.getByRole('button', { name: 'Clear and start over' }).click();
    await expect(outputField(page)).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
  });
});
