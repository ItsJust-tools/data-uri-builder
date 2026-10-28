import type { Page } from '@playwright/test';

/** Accessible name of the sidebar text input. */
export const TEXT_INPUT_NAME = 'Text content to convert to data URI';

/** Accessible name of the generated data URI output field. */
export const OUTPUT_NAME = 'Generated data URI';

/** Empty-state copy shown on the canvas before a URI has been generated. */
export const EMPTY_STATE_TEXT = 'Type text, upload a file, or enter a URL to generate a data URI';

/**
 * Opens the options sidebar when the shell starts with it collapsed
 * (mobile viewports default to collapsed).
 */
export async function openSidebar(page: Page) {
  const sidebar = page.locator('.tool-shell-sidebar');
  if ((await sidebar.count()) === 0) return;

  const isCollapsed = await sidebar.evaluate((el) => el.classList.contains('collapsed'));
  if (isCollapsed) {
    await page.locator('[data-sidebar-toggle]').click();
    await sidebar.waitFor({ state: 'visible' });
  }
}

/**
 * Sets a textarea's value through the native value setter so React's
 * controlled input sees a genuine `input` event.
 */
export async function fillTextarea(page: Page, name: string, value: string) {
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

/**
 * Sets an `<input>` value through the native value setter so React's
 * controlled input sees a genuine `input` event. Used instead of `fill()`
 * for sidebar fields, which can sit outside the mobile dialog viewport.
 */
export async function fillInput(page: Page, name: string, value: string) {
  const input = page.getByRole('textbox', { name });
  await input.evaluate((el, text) => {
    const field = el as HTMLInputElement;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    nativeInputValueSetter?.call(field, text);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

/**
 * Clicks a control inside the scrollable sidebar without relying on
 * native hit-testing (the sidebar can be taller than the viewport).
 */
export async function clickInSidebar(
  page: Page,
  role: 'button' | 'tab' | 'checkbox',
  name: string
) {
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

/** Fills the text input and generates the data URI. */
export async function generateFromText(page: Page, text: string) {
  await openSidebar(page);
  await fillTextarea(page, TEXT_INPUT_NAME, text);
  await clickInSidebar(page, 'button', 'Generate Data URI');
}

/** Returns the generated data URI output textbox. */
export function outputField(page: Page) {
  return page.getByRole('textbox', { name: OUTPUT_NAME });
}

/**
 * Waits until React has hydrated the shell. The theme toggle renders disabled
 * during server/first render, so an enabled toggle means listeners are bound
 * and keyboard shortcuts will be handled.
 */
export async function waitForHydration(page: Page) {
  await page.getByRole('button', { name: /^Switch to (dark|light) mode$/ }).waitFor({
    state: 'visible',
    timeout: 20000,
  });
  await page
    .locator('button.theme-toggle-btn:not([disabled])')
    .waitFor({ state: 'visible', timeout: 20000 });
}

/**
 * Removes focus from the active element so global keyboard shortcuts are
 * handled outside an input field.
 */
export async function blurActiveElement(page: Page) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
}

/**
 * Builds a `DataTransfer` handle carrying a single synthetic file, for
 * dispatching drag-and-drop events.
 */
export async function dataTransferWithFile(
  page: Page,
  file: { name: string; content: string | number[]; type?: string }
) {
  return page.evaluateHandle(({ name, content, type }) => {
    const dataTransfer = new DataTransfer();
    const parts = Array.isArray(content) ? [new Uint8Array(content)] : [content];
    dataTransfer.items.add(new File(parts, name, { type }));
    return dataTransfer;
  }, file);
}

/**
 * Waits until the auto-save debounce has flushed the tool state to
 * localStorage, then returns the persisted state object.
 */
export async function waitForAutoSave(page: Page, timeout = 20000) {
  const readState = () =>
    page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) =>
        /^itsjust:[^:]+:data-uri-builder:data-uri-builder$/.test(k)
      );
      if (!key) return null;
      try {
        const entry = JSON.parse(localStorage.getItem(key) ?? 'null');
        return (entry?.data ?? null) as Record<string, unknown> | null;
      } catch {
        return null;
      }
    });

  const deadline = Date.now() + timeout;
  let state = await readState();
  while (Date.now() < deadline) {
    if (state && typeof state.textInput === 'string') return state;
    await page.waitForTimeout(250);
    state = await readState();
  }
  return state;
}
