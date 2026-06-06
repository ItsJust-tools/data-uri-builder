import type { Tool } from '@itsjust/core';
import toolConfig from './tool.config';
import type { DataUriState } from './types';

/**
 * Checks whether an unknown value is a valid DataUriState object.
 * Validates that all required fields are present with correct types,
 * and that enum-like fields (inputMode, selectedMimeType) are strings
 * (runtime validation, not strict to the union to allow future additions).
 *
 * @param value - Unknown value to validate
 * @returns True if the value is a valid DataUriState
 */
function isDataUriState(value: unknown): value is DataUriState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.inputMode === 'string' &&
    typeof v.textInput === 'string' &&
    typeof v.fileName === 'string' &&
    typeof v.selectedMimeType === 'string' &&
    typeof v.customMimeType === 'string' &&
    typeof v.dataUri === 'string' &&
    typeof v.isBase64 === 'boolean' &&
    typeof v.fileSize === 'number' &&
    !Number.isNaN(v.fileSize as number) &&
    typeof v.fileBytes === 'string' &&
    typeof v.urlInput === 'string' &&
    typeof v.error === 'string'
  );
}

/**
 * Build a data URI string from the given MIME type, content, and encoding preference.
 *
 * Behavior by encoding mode:
 * - When `isBase64` is true: the content is base64-encoded, `;base64` is appended
 *   to the MIME type. Supports non-Latin1 characters via TextEncoder fallback.
 * - When `isBase64` is false and the MIME type starts with `text/`: content is
 *   URL-encoded, no charset suffix.
 * - When `isBase64` is false and the MIME type is non-text: content is assumed
 *   to be pre-encoded base64 (e.g. from a file upload), `;base64` is appended,
 *   and the content is passed through as-is (no double-encoding).
 *
 * @param mimeType - MIME type string (e.g. "text/plain", "image/png")
 * @param content - Raw content string to encode
 * @param isBase64 - Whether to base64-encode the content
 * @returns A complete data URI string
 */
function buildDataUri(mimeType: string, content: string, isBase64: boolean): string {
  if (isBase64) {
    // Encode raw content to base64
    let base64: string;
    try {
      base64 = btoa(content);
    } catch {
      // Content may contain non-Latin1 characters; use TextEncoder fallback
      const bytes = new TextEncoder().encode(content);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte !== undefined) binary += String.fromCharCode(byte);
      }
      base64 = btoa(binary);
    }
    return `data:${mimeType};base64,${base64}`;
  }

  if (mimeType.startsWith('text/')) {
    // URL-encode text content, no charset suffix
    return `data:${mimeType},${encodeURIComponent(content)}`;
  }

  // Non-text content without base64 flag: assume pre-encoded base64
  return `data:${mimeType};base64,${content}`;
}

export const dataUriTool: Tool<DataUriState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    inputMode: 'text',
    textInput: '',
    fileName: '',
    selectedMimeType: 'text/plain',
    customMimeType: '',
    dataUri: '',
    isBase64: false,
    fileSize: 0,
    fileBytes: '',
    error: '',
    urlInput: '',
  },
  serialize: (state) => JSON.stringify(state, null, 2),
  deserialize: (data) => {
    if (isDataUriState(data)) {
      return { success: true, data };
    }
    return {
      success: false,
      error: 'Invalid data format: expected DataUriState object',
    };
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

export { buildDataUri };
