/**
 * Clipboard utilities with graceful fallback for insecure origins and
 * permission rejections.
 *
 * The async Clipboard API (`navigator.clipboard.writeText`) is only available
 * in secure contexts (HTTPS or localhost) and can reject when the user denies
 * clipboard permissions or when the document is embedded in an unauthenticated
 * iframe. When that happens we fall back to the synchronous
 * `document.execCommand('copy')` path using an off-screen textarea, which works
 * in a wider range of environments (including plain HTTP staging servers).
 */

/**
 * Copies `text` to the clipboard, preferring the async Clipboard API and
 * falling back to `document.execCommand('copy')` when the API is unavailable
 * or rejects.
 *
 * @returns `true` when the copy succeeded, `false` otherwise.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Prefer the modern async Clipboard API when available (secure context).
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied, insecure context, or transient failure — fall through
      // to the legacy execCommand path.
    }
  }

  // 2. Fallback: legacy synchronous copy via an off-screen textarea.
  return copyWithExecCommand(text);
}

/**
 * Copies `text` using `document.execCommand('copy')` on an off-screen
 * textarea. Returns `true` when the browser reports a successful copy.
 */
export function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Keep the element in the DOM (required for execCommand) but off-screen and
  // invisible so it never flashes or shifts layout.
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0';

  let succeeded = false;
  try {
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  } finally {
    // Always clean up, even when execCommand throws.
    if (textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  }
  return succeeded;
}
