'use client';

import Link from 'next/link';

interface ToolToolbarProps {
  hasDataUri?: boolean;
  onCopyUri?: () => void;
}

export function ToolToolbar({ hasDataUri = false, onCopyUri }: ToolToolbarProps) {
  return (
    <div className="datauri-toolbar">
      <Link href="/help" className="toolbar-btn toolbar-help-link" aria-label="Open help page">
        Help
      </Link>
      {hasDataUri && (
        <>
          <button
            className="toolbar-btn toolbar-copy-btn"
            onClick={onCopyUri}
            aria-label="Copy data URI to clipboard"
          >
            Copy URI
          </button>
          <span className="datauri-toolbar-hint">
            <kbd>Ctrl+Shift+C</kbd> Copy
          </span>
          <span className="datauri-toolbar-hint">
            <kbd>Ctrl+Shift+V</kbd> Paste
          </span>
        </>
      )}
    </div>
  );
}
