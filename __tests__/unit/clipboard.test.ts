import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard, copyWithExecCommand } from '@/lib/clipboard';

describe('copyTextToClipboard', () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    vi.restoreAllMocks();
    // jsdom does not implement execCommand; define it so we can spy on it.
    if (!('execCommand' in document)) {
      Object.defineProperty(document, 'execCommand', {
        value: () => false,
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    // Restore navigator/document to their original jsdom implementations.
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
  });

  it('returns false for empty text', async () => {
    await expect(copyTextToClipboard('')).resolves.toBe(false);
    await expect(copyTextToClipboard('   ')).resolves.toBe(false);
  });

  it('uses the async Clipboard API when available and resolves', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });

    await expect(copyTextToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when the Clipboard API rejects (permission denied)', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });

    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    await expect(copyTextToClipboard('fallback')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('fallback');
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when navigator.clipboard is undefined (insecure origin)', async () => {
    // In insecure contexts navigator.clipboard is undefined.
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    await expect(copyTextToClipboard('insecure')).resolves.toBe(true);
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  it('returns false when both the Clipboard API and execCommand fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });

    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(false);

    await expect(copyTextToClipboard('nope')).resolves.toBe(false);
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  it('returns false when execCommand throws', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('execCommand unavailable');
    });

    await expect(copyTextToClipboard('boom')).resolves.toBe(false);
    expect(execSpy).toHaveBeenCalledWith('copy');
  });
});

describe('copyWithExecCommand', () => {
  it('returns false when document is undefined', () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error - simulating a non-DOM environment
    delete globalThis.document;
    expect(copyWithExecCommand('x')).toBe(false);
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
  });

  it('creates an off-screen textarea, copies, and cleans up', () => {
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    const result = copyWithExecCommand('data:text/plain,hi');

    expect(result).toBe(true);
    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);

    const textarea = appendSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.value).toBe('data:text/plain,hi');
    expect(textarea.style.opacity).toBe('0');
    expect(textarea.style.position).toBe('fixed');
  });

  it('cleans up the textarea even when execCommand throws', () => {
    const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('copy failed');
    });
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    const result = copyWithExecCommand('data:text/plain,hi');

    expect(result).toBe(false);
    expect(execSpy).toHaveBeenCalledWith('copy');
    // The textarea must be cleaned up from the DOM even on failure.
    expect(removeSpy).toHaveBeenCalled();
  });
});
