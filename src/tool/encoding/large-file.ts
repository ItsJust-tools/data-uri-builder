/**
 * Chunked Base64 encoding with Web Worker offloading for large files.
 *
 * Large file uploads (> LARGE_FILE_WARNING_BYTES) are warned about before
 * encoding; files above CHUNKED_ENCODING_THRESHOLD_BYTES are encoded off the
 * main UI thread in a bundled inline Web Worker so the browser tab stays
 * responsive (see issue #52).
 */

export const LARGE_FILE_WARNING_BYTES = 5 * 1024 * 1024; // 5 MB
export const CHUNKED_ENCODING_THRESHOLD_BYTES = 10 * 1024 * 1024; // 10 MB

const CHUNK_SIZE_BYTES = 0x8000; // 32 KiB fits in btoa's argument limits

export interface ChunkedEncodingResult {
  /** Base64 payload (no data: prefix) */
  base64: string;
  /** Which path performed the encoding */
  strategy: 'worker' | 'main-thread-chunked' | 'sync';
}

/** True when a file crosses the "large file" warning threshold (5 MB). */
export function shouldWarnLargeFile(sizeBytes: number): boolean {
  return sizeBytes > LARGE_FILE_WARNING_BYTES;
}

/** True when encoding should be offloaded/chunked (10 MB). */
export function shouldChunkEncode(sizeBytes: number): boolean {
  return sizeBytes > CHUNKED_ENCODING_THRESHOLD_BYTES;
}

/**
 * Encode raw bytes to base64 in fixed-size chunks. Chunking keeps peak
 * string allocations small so the encoder can run incrementally anywhere
 * (main thread fallback or worker).
 */
function encodeBytesChunked(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE_BYTES) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE_BYTES);
    let part = '';
    for (let i = 0; i < chunk.length; i++) {
      part += String.fromCharCode(chunk[i] as number);
    }
    binary += part;
  }
  return btoa(binary);
}

/** Worker source: receives {id, bytes} and answers {id, base64, error?}. */
const WORKER_SOURCE = `
self.onmessage = (event) => {
  const { id, bytes } = event.data;
  try {
    const view = new Uint8Array(bytes);
    const CHUNK_SIZE = ${CHUNK_SIZE_BYTES};
    let binary = '';
    for (let offset = 0; offset < view.length; offset += CHUNK_SIZE) {
      const chunk = view.subarray(offset, offset + CHUNK_SIZE);
      let part = '';
      for (let i = 0; i < chunk.length; i++) {
        part += String.fromCharCode(chunk[i]);
      }
      binary += part;
    }
    self.postMessage({ id, base64: btoa(binary) });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
`;

/** One-shot inline worker: encodes one payload, then the worker terminates. */
function encodeWithWorker(bytes: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const id = Date.now();
    const finish = (fn: () => void) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      fn();
    };
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { id?: number; base64?: string; error?: string };
      if (data.id !== id) return;
      if (typeof data.base64 === 'string') {
        finish(() => resolve(data.base64 as string));
      } else {
        finish(() => reject(new Error(data.error || 'Worker encoding failed')));
      }
    };
    worker.onerror = (event) => {
      finish(() => reject(new Error(event.message || 'Worker error')));
    };
    worker.postMessage({ id, bytes }, [bytes]);
  });
}

/**
 * Encode bytes to base64 off the main thread when the payload is large.
 * Falls back to chunked main-thread encoding when Web Workers (or Blob
 * worker URLs) are unavailable, e.g. in test environments or very old
 * browsers. The result is identical either way.
 */
export async function encodeBytesToBase64OffMainThread(
  bytes: ArrayBuffer
): Promise<ChunkedEncodingResult> {
  if (shouldChunkEncode(bytes.byteLength) && typeof Worker !== 'undefined') {
    try {
      const base64 = await encodeWithWorker(bytes);
      return { base64, strategy: 'worker' };
    } catch {
      // fall through to chunked main-thread encoding
    }
  }
  if (shouldChunkEncode(bytes.byteLength)) {
    return { base64: encodeBytesChunked(new Uint8Array(bytes)), strategy: 'main-thread-chunked' };
  }
  return { base64: encodeBytesChunked(new Uint8Array(bytes)), strategy: 'sync' };
}

export interface ReadFileResult extends ChunkedEncodingResult {
  /** Number of bytes in the file */
  size: number;
}

/**
 * Reads a File as base64, offloading to a Web Worker for large files.
 * Only the file's bytes are materialized (no giant data-URL string), so
 * memory use stays bounded for big uploads.
 */
export async function readFileAsBase64(file: File): Promise<ReadFileResult> {
  const bytes = await file.arrayBuffer();
  const result = await encodeBytesToBase64OffMainThread(bytes);
  return { ...result, size: file.size };
}

/**
 * Formats a byte count for human-facing warnings (e.g. "5.2 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Builds the copy-as-CSS snippet: `background-image: url("data:...")`.
 */
export function buildCssSnippet(dataUri: string): string {
  return `background-image: url("${dataUri}");`;
}

/**
 * Builds the copy-as-HTML snippet for the given data URI and MIME type.
 * Uses the semantically-correct element when the MIME type is recognizable
 * (img/link/script) and falls back to an <img> for image-unknown types.
 */
export function buildHtmlSnippet(dataUri: string, mimeType: string): string {
  const mime = mimeType.trim().toLowerCase();
  if (mime.startsWith('image/')) return `<img src="${dataUri}" alt="">`;
  if (mime === 'text/css') return `<link rel="stylesheet" href="${dataUri}">`;
  if (
    mime === 'text/javascript' ||
    mime === 'application/javascript' ||
    mime === 'application/ecmascript'
  ) {
    return `<script src="${dataUri}"></script>`;
  }
  return `<img src="${dataUri}" alt="">`;
}
