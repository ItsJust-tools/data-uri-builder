'use client';

import { useCallback } from 'react';
import type { DataUriState } from '../types';

interface ToolCanvasProps {
  /** Current tool state containing data URI and related info */
  state: DataUriState;
  /** Ref forwarded to the canvas container for export/screenshot operations */
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when user clicks Copy — shows toast feedback in ToolClient */
  onCopyUri?: () => void;
}

export function ToolCanvas({ state, canvasRef, onCopyUri }: ToolCanvasProps) {
  /**
   * Fallback copy handler used when onCopyUri prop is not provided.
   * Uses the modern Clipboard API to write the data URI text.
   * Note: onCopyUri is always passed from ToolClient, so this only
   * fires if the component is used standalone without a parent handler.
   */
  const handleCopy = useCallback(async () => {
    if (state.dataUri && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(state.dataUri);
      } catch {
        // Clipboard API rejected; silently fail as the parent onCopyUri
        // will show a toast notification when connected via ToolClient.
      }
    }
  }, [state.dataUri]);

  const dataUriLength = state.dataUri.length;
  const overheadBytes = state.dataUri.length;
  const originalSize = state.fileSize || state.textInput.length;
  const overheadRatio =
    originalSize > 0 ? ((overheadBytes / originalSize) * 100 - 100).toFixed(1) : '0';

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
              <span className="stat-badge stat-badge-size">
                {dataUriLength.toLocaleString()} chars
              </span>
              {originalSize > 0 && (
                <span className="stat-badge stat-badge-overhead">+{overheadRatio}% overhead</span>
              )}
            </div>
          </div>
          <div className="datauri-output-wrapper">
            <textarea
              readOnly
              value={state.dataUri}
              className="datauri-output"
              aria-label="Generated data URI"
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
              onClick={onCopyUri || handleCopy}
              aria-label="Copy data URI to clipboard"
            >
              Copy to Clipboard
            </button>
            <a
              href={state.dataUri}
              download={state.fileName || 'data.txt'}
              className="datauri-btn datauri-btn-secondary"
              aria-label="Download as file"
            >
              Download
            </a>
            <a
              href={state.dataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="datauri-btn datauri-btn-outline"
              aria-label="Preview in new tab"
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
