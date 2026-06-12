'use client';

import type { DataUriState } from '../types';

/**
 * Map MIME types to recommended file extensions for download.
 * Falls back to a reasonable extension for common types.
 */
function extensionFromMime(mimeType: string): string {
const extensionMap = {
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/xml': 'xml',
    'image/svg+xml': 'svg',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'font/woff2': 'woff2',
    'font/woff': 'woff',
    'font/ttf': 'ttf',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'application/octet-stream': 'bin',
  } as const;

  return extensionMap[mimeType as keyof typeof extensionMap] || 'bin';
}

interface ToolCanvasProps {
  /** Current tool state containing data URI and related info */
  state: DataUriState;
  /** Ref forwarded to the canvas container for export/screenshot operations */
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when user clicks Copy — shows toast feedback in ToolClient */
  onCopyUri?: () => void;
}

export function ToolCanvas({ state, canvasRef, onCopyUri }: ToolCanvasProps) {
  const mimeLabel = state.selectedMimeType === 'custom' ? state.customMimeType || 'application/octet-stream' : state.selectedMimeType;
  const dataUriLength = state.dataUri.length;
  const originalSize = state.fileSize > 0 ? state.fileSize : (state.textInput.length || 0);
  const sizeDiff = originalSize > 0 ? (dataUriLength - originalSize) : 0;
  const overheadRatio =
    originalSize > 0 ? ((dataUriLength / originalSize) * 100 - 100).toFixed(1) : '0';
  const sizeLabel = sizeDiff <= 0 ? 'saved' : 'overhead';

  return (
    <div
      ref={canvasRef}
      className="datauri-canvas"
      role="application"
      aria-label="Data URI Builder"
    >
      {/* Result area */}
      {state.dataUri ? (
        <div className="datauri-result">
          <div className="datauri-header">
            <h2 className="datauri-title">Generated Data URI</h2>
            <div className="datauri-stats">
              <span className="stat-badge stat-badge-size" title={`${dataUriLength.toLocaleString()} characters`}>
                {dataUriLength.toLocaleString()} chars
              </span>
              {originalSize > 0 && (
                <span className={`stat-badge stat-badge-${sizeLabel}`} title={`Original: ${originalSize.toLocaleString()} chars → URI: ${dataUriLength.toLocaleString()} chars`}>
                  {sizeDiff <= 0 ? '' : '+'}{overheadRatio}%
                  {' '}{sizeLabel}
                  <span className="stat-badge-detail">
                    {' '}
                    ({originalSize.toLocaleString()} → {dataUriLength.toLocaleString()} chars)
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="datauri-output-wrapper">
            <textarea
              readOnly
              value={state.dataUri}
              className="datauri-output"
              aria-label="Generated data URI"
              title={`${dataUriLength.toLocaleString()} character data URI`}
              rows={Math.min(Math.ceil(dataUriLength / 80), 12)}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            {state.isBase64 && (
              <div className="datauri-output-info">
                <span className="info-dot" /> Base64 encoded
              </div>
            )}
          </div>
          <div className="datauri-actions">
            <button
              type="button"
              className="datauri-btn datauri-btn-primary"
              onClick={onCopyUri}
              aria-label="Copy data URI to clipboard"
            >
              Copy to Clipboard
            </button>
            <a
              href={state.dataUri}
              download={state.fileName || `data-uri.${extensionFromMime(mimeLabel)}`}
              className="datauri-btn datauri-btn-secondary"
              aria-label="Download data URI as file"
            >
              Download
            </a>
            <a
              href={state.dataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="datauri-btn datauri-btn-outline"
              aria-label="Preview data URI in new tab (opens in new window)"
            >
              Preview ↗
            </a>
          </div>
        </div>
      ) : (
        <div className="datauri-empty">
          <div className="datauri-empty-icon" aria-hidden="true">
            📦
          </div>
          <p className="datauri-empty-text">
            Type text, upload a file, or enter a URL to generate a data URI
          </p>
        </div>
      )}
    </div>
  );
}

ToolCanvas.displayName = 'ToolCanvas';
