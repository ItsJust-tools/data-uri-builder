import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldWarnLargeFile,
  shouldChunkEncode,
  encodeBytesToBase64OffMainThread,
  readFileAsBase64,
  buildCssSnippet,
  buildHtmlSnippet,
  formatBytes,
  LARGE_FILE_WARNING_BYTES,
  CHUNKED_ENCODING_THRESHOLD_BYTES,
} from '@/tool/encoding/large-file';

describe('large-file thresholds', () => {
  it('warns above 5MB and not below', () => {
    expect(LARGE_FILE_WARNING_BYTES).toBe(5 * 1024 * 1024);
    expect(shouldWarnLargeFile(5 * 1024 * 1024)).toBe(false);
    expect(shouldWarnLargeFile(5 * 1024 * 1024 + 1)).toBe(true);
    expect(shouldWarnLargeFile(1024)).toBe(false);
  });

  it('chunks encoding above 10MB only', () => {
    expect(CHUNKED_ENCODING_THRESHOLD_BYTES).toBe(10 * 1024 * 1024);
    expect(shouldChunkEncode(10 * 1024 * 1024)).toBe(false);
    expect(shouldChunkEncode(10 * 1024 * 1024 + 1)).toBe(true);
  });

  it('formats byte sizes for humans', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });
});

describe('encodeBytesToBase64OffMainThread', () => {
  it('matches btoa for small payloads (sync path)', async () => {
    const bytes = new TextEncoder().encode('hello world');
    const { base64, strategy } = await encodeBytesToBase64OffMainThread(bytes.buffer);
    expect(base64).toBe(btoa('hello world'));
    expect(strategy).toBe('sync');
  });

  it('matches btoa for chunked payloads', async () => {
    const bytes = new Uint8Array(200_000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    const { base64, strategy } = await encodeBytesToBase64OffMainThread(bytes.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] as number);
    expect(base64).toBe(btoa(binary));
    expect(['sync', 'main-thread-chunked', 'worker']).toContain(strategy);
  });

  it('uses the worker path for very large payloads when Worker is available', async () => {
    const big = new Uint8Array(10 * 1024 * 1024 + 16);
    for (let i = 0; i < big.length; i++) big[i] = (i * 7) % 256;
    const { base64, strategy } = await encodeBytesToBase64OffMainThread(big.buffer);
    if (typeof Worker !== 'undefined') {
      expect(strategy).toBe('worker');
    } else {
      expect(['main-thread-chunked', 'sync']).toContain(strategy);
    }
    // Spot check: decode prefix back
    const prefixBinary = atob(base64.slice(0, 40));
    expect(prefixBinary.length).toBeGreaterThan(0);
  });

  it('falls back to main-thread when Worker construction throws', async () => {
    const OriginalWorker = globalThis.Worker;
    const big = new Uint8Array(10 * 1024 * 1024 + 16);
    class BrokenWorker {
      constructor() {
        throw new Error('no workers here');
      }
    }
    // @ts-expect-error test stub
    globalThis.Worker = BrokenWorker;
    try {
      const { strategy, base64 } = await encodeBytesToBase64OffMainThread(big.buffer);
      expect(['main-thread-chunked', 'sync']).toContain(strategy);
      expect(base64.length).toBeGreaterThan(0);
    } finally {
      globalThis.Worker = OriginalWorker;
    }
  });
});

describe('readFileAsBase64', () => {
  it('reads a small file as base64', async () => {
    const file = new File([new TextEncoder().encode('abc')], 'a.txt');
    const result = await readFileAsBase64(file);
    expect(result.base64).toBe(btoa('abc'));
    expect(result.size).toBe(3);
    expect(result.strategy).toBe('sync');
  });
});

describe('snippet builders (issue #52 copy actions)', () => {
  it('builds a CSS background-image snippet', () => {
    expect(buildCssSnippet('data:image/png;base64,AAA')).toBe(
      'background-image: url("data:image/png;base64,AAA");'
    );
  });

  it('builds an img snippet for image types', () => {
    expect(buildHtmlSnippet('data:image/png;base64,AAA', 'image/png')).toBe(
      '<img src="data:image/png;base64,AAA" alt="">'
    );
  });

  it('builds a link tag for CSS', () => {
    expect(buildHtmlSnippet('data:text/css,abc', 'text/css')).toBe(
      '<link rel="stylesheet" href="data:text/css,abc">'
    );
  });

  it('builds a script tag for JavaScript', () => {
    expect(buildHtmlSnippet('data:text/javascript,abc', 'text/javascript')).toBe(
      '<script src="data:text/javascript,abc"></script>'
    );
  });

  it('falls back to img for unknown types', () => {
    expect(
      buildHtmlSnippet('data:application/octet-stream;base64,AAA', 'application/octet-stream')
    ).toBe('<img src="data:application/octet-stream;base64,AAA" alt="">');
  });
});
