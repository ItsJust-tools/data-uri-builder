import { test, expect, type Page } from '@playwright/test';

async function openSidebar(page: Page) {
  const sidebar = page.locator('.tool-shell-sidebar');
  if ((await sidebar.count()) === 0) return;

  const isCollapsed = await sidebar.evaluate((el) => el.classList.contains('collapsed'));
  if (isCollapsed) {
    await page.locator('[data-sidebar-toggle]').click();
    await expect(sidebar).toHaveClass(/open/);
  }
}

async function fillTextarea(page: Page, name: string, value: string) {
  const textarea = page.getByRole('textbox', { name });
  await textarea.scrollIntoViewIfNeeded();
  await textarea.evaluate((el, text) => {
    const input = el as HTMLTextAreaElement;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    nativeInputValueSetter?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function clickInSidebar(page: Page, role: 'button' | 'tab' | 'checkbox', name: string) {
  const control = page.getByRole(role, { name });
  await page.locator('.sidebar-content').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await control.scrollIntoViewIfNeeded();
  if (role === 'checkbox') {
    await control.evaluate((el) => {
      const input = el as HTMLInputElement;
      if (!input.checked) input.click();
    });
    return;
  }
  await control.evaluate((el) => {
    (el as HTMLElement).click();
  });
}

test.describe('Data URI Builder E2E', () => {
  test('renders the tool with default content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveText('loading...', { timeout: 10000 });
    await expect(page.getByRole('application', { name: 'Data URI Builder' })).toBeVisible();
  });

  test('generates data URI from text input', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    const textarea = page.getByRole('textbox', { name: 'Text content to convert to data URI' });
    await fillTextarea(page, 'Text content to convert to data URI', 'Hello World');
    await expect(textarea).toHaveValue('Hello World');

    await clickInSidebar(page, 'button', 'Generate Data URI');

    const output = page.getByRole('textbox', { name: 'Generated data URI' });
    await expect(output).toBeVisible();
    await expect(output).toHaveValue(/^data:/);
  });

  test('switches between input modes', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await clickInSidebar(page, 'tab', 'file input');
    await expect(page.getByText(/Click or drag to choose a file/i)).toBeVisible();

    await clickInSidebar(page, 'tab', 'url input');
    await expect(page.getByPlaceholder('https://example.com/image.png')).toBeVisible();

    await clickInSidebar(page, 'tab', 'text input');
    await expect(
      page.getByRole('textbox', { name: 'Text content to convert to data URI' })
    ).toBeVisible();
  });

  test('allows copying data URI to clipboard', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await fillTextarea(page, 'Text content to convert to data URI', 'Test copy');
    await clickInSidebar(page, 'button', 'Generate Data URI');

    await page
      .getByRole('application', { name: 'Data URI Builder' })
      .getByRole('button', { name: 'Copy data URI to clipboard' })
      .click();
  });

  test('allows toggling base64 encoding', async ({ page }) => {
    await page.goto('/');
    await openSidebar(page);

    await clickInSidebar(page, 'checkbox', 'Use base64 encoding');

    await fillTextarea(page, 'Text content to convert to data URI', 'Test');
    await clickInSidebar(page, 'button', 'Generate Data URI');

    const output = page.getByRole('textbox', { name: 'Generated data URI' });
    await expect(output).toBeVisible();
  });
});
