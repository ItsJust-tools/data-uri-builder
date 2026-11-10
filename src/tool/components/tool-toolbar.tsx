'use client';

import Link from 'next/link';

interface ToolToolbarProps {
  /** Whether a data URI has been generated (shows Copy URI button) */
  hasDataUri?: boolean;
  /** Called when the Copy URI button is clicked */
  onCopyUri?: () => void;
  /** Called when the Copy as CSS button is clicked */
  onCopyAsCss?: () => void;
  /** Called when the Copy as HTML button is clicked */
  onCopyAsHtml?: () => void;
}

export function ToolToolbar({
  hasDataUri = false,
  onCopyUri,
  onCopyAsCss,
  onCopyAsHtml,
}: ToolToolbarProps) {
  return (
    <div className="datauri-toolbar">
      <Link href="/help" className="toolbar-btn toolbar-help-link" aria-label="Open help page">
        Help
      </Link>
      {hasDataUri && (
        <button
          className="toolbar-btn toolbar-copy-btn"
          onClick={onCopyUri}
          aria-label="Copy data URI to clipboard"
        >
          Copy URI
        </button>
      )}
      {hasDataUri && onCopyAsCss && (
        <button
          className="toolbar-btn toolbar-copy-css-btn"
          onClick={onCopyAsCss}
          aria-label="Copy as CSS background-image snippet"
        >
          Copy as CSS
        </button>
      )}
      {hasDataUri && onCopyAsHtml && (
        <button
          className="toolbar-btn toolbar-copy-html-btn"
          onClick={onCopyAsHtml}
          aria-label="Copy as HTML img snippet"
        >
          Copy as HTML
        </button>
      )}
      <span className="datauri-toolbar-hint">
        <kbd>Ctrl+Shift+C</kbd> Copy
      </span>
      <span className="datauri-toolbar-hint">
        <kbd>Ctrl+Shift+V</kbd> Paste
      </span>
      <span className="datauri-toolbar-hint">
        <kbd>Ctrl+Shift+E</kbd> Export
      </span>
    </div>
  );
}
ToolToolbar.displayName = 'ToolToolbar';
