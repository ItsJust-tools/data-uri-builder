export type InputMode = 'text' | 'file' | 'url';

export type DataUriType =
  | 'text/plain'
  | 'text/html'
  | 'text/css'
  | 'text/javascript'
  | 'application/json'
  | 'application/xml'
  | 'image/svg+xml'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/gif'
  | 'application/pdf'
  | 'font/ttf'
  | 'font/woff2'
  | 'font/woff'
  | 'audio/mpeg'
  | 'audio/ogg'
  | 'audio/wav'
  | 'video/mp4'
  | 'video/webm'
  | 'font/otf'
  | 'application/octet-stream'
  | 'custom';

export interface DataUriState {
  inputMode: InputMode;
  textInput: string;
  fileName: string;
  selectedMimeType: DataUriType;
  customMimeType: string;
  dataUri: string;
  isBase64: boolean;
  fileSize: number;
  fileBytes: string; // base64 encoded file content for file mode
  error: string;
  /** Optimize SVG output: use percent-encoded UTF-8 data URIs for SVG content (smaller than base64) */
  optimizeSvg: boolean;
  urlInput: string;
}

export const DEFAULT_MIME_TYPES: { label: string; value: DataUriType }[] = [
  { label: 'text/plain', value: 'text/plain' },
  { label: 'text/html', value: 'text/html' },
  { label: 'text/css', value: 'text/css' },
  { label: 'text/javascript', value: 'text/javascript' },
  { label: 'application/json', value: 'application/json' },
  { label: 'application/xml', value: 'application/xml' },
  { label: 'image/svg+xml', value: 'image/svg+xml' },
  { label: 'image/png', value: 'image/png' },
  { label: 'image/jpeg', value: 'image/jpeg' },
  { label: 'image/webp', value: 'image/webp' },
  { label: 'image/gif', value: 'image/gif' },
  { label: 'application/pdf', value: 'application/pdf' },
  { label: 'application/octet-stream', value: 'application/octet-stream' },
  { label: 'font/ttf', value: 'font/ttf' },
  { label: 'font/woff2', value: 'font/woff2' },
  { label: 'font/woff', value: 'font/woff' },
  { label: 'audio/mpeg', value: 'audio/mpeg' },
  { label: 'audio/ogg', value: 'audio/ogg' },
  { label: 'audio/wav', value: 'audio/wav' },
  { label: 'video/mp4', value: 'video/mp4' },
  { label: 'video/webm', value: 'video/webm' },
  { label: 'font/otf', value: 'font/otf' },
  { label: 'Custom…', value: 'custom' },
];

/**
 * Returns true if the given MIME type string denotes SVG content.
 * Matches "image/svg+xml" and the lenient legacy "image/svg" form.
 */
export function isSvgMimeType(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  return normalized === 'image/svg+xml' || normalized === 'image/svg';
}

/**
 * Produces a percent-encoded SVG data URI:
 * `data:image/svg+xml;utf8,<svg-content>` with characters that break data
 * URIs (%, #, quotes, newlines, control chars) percent-encoded, per RFC 2397.
 * Typically 20-30% smaller than the base64 equivalent for SVG payloads.
 *
 * @param svgContent - Raw SVG/XML source text
 * @returns The encoded SVG data URI (without a specific mime prefix validation)
 */
export function svgToUrlEncodedDataUri(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent)
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;utf8,${encoded}`;
}
