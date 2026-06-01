import type { Tool } from '@itsjust/core';
import toolConfig from './tool.config';
import type { DataUriState } from './types';

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
    typeof v.urlInput === 'string' &&
    typeof v.fileBytes === 'string'
  );
}

function buildDataUri(mimeType: string, content: string, isBase64: boolean): string {
  const charset = mimeType.startsWith('text/') && !isBase64 ? '' : ';base64';
  return `data:${mimeType}${charset},${isBase64 ? content : encodeURIComponent(content)}`;
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
