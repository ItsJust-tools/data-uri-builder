'use client';

import { useCallback, useState, useId, type DragEvent } from 'react';
import type { DataUriState, InputMode, DataUriType } from '../types';
import { DEFAULT_MIME_TYPES } from '../types';

interface ToolSidebarProps {
  /** Current tool state */
  state: DataUriState;
  /** Switch between text/file/URL input modes */
  onInputModeChange: (mode: InputMode) => void;
  /** Update text content for text mode */
  onTextInputChange: (text: string) => void;
  /** Handle file selection/upload for file mode */
  onFileUpload: (file: File) => void;
  /** Update URL input value */
  onUrlInputChange: (url: string) => void;
  /** Change the selected MIME type */
  onMimeTypeChange: (mime: DataUriType) => void;
  /** Update custom MIME type text */
  onCustomMimeChange: (mime: string) => void;
  /** Toggle base64 encoding */
  onBase64Toggle: (isBase64: boolean) => void;
  /** Generate the data URI from current inputs */
  onGenerateUri: () => void;
  /** Reset everything to initial state */
  onClear: () => void;
}

export function ToolSidebar({
  state,
  onInputModeChange,
  onTextInputChange,
  onFileUpload,
  onUrlInputChange,
  onMimeTypeChange,
  onCustomMimeChange,
  onBase64Toggle,
  onGenerateUri,
  onClear,
}: ToolSidebarProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        // Auto-switch to file mode when a file is dropped, regardless of current mode
        if (state.inputMode !== 'file') {
          onInputModeChange('file');
        }
        onFileUpload(file);
      }
    },
    [onFileUpload, onInputModeChange, state.inputMode]
  );

  // Unique IDs for accessibility
  const textareaId = useId();
  const fileInputId = useId();
  const mimeSelectId = useId();
  const customMimeInputId = useId();

  return (
    <div className="datauri-sidebar" role="form" aria-label="Data URI options">
      {/* Input Mode Selector */}
      <div className="sidebar-section">
        <h3>Input Source</h3>
        <div className="input-mode-tabs" role="tablist" aria-label="Input source">
          {(['text', 'file', 'url'] as InputMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              className={`input-mode-tab ${state.inputMode === mode ? 'active' : ''}`}
              onClick={() => onInputModeChange(mode)}
              aria-selected={state.inputMode === mode}
              aria-label={`${mode} input`}
            >
              {mode === 'text' && '📝'}
              {mode === 'file' && '📁'}
              {mode === 'url' && '🔗'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Input Content */}
      <div className="sidebar-section">
        <h3>Content</h3>
        {state.inputMode === 'text' && (
          <div className="input-group">
            <label htmlFor={textareaId} className="sidebar-section-label">
              Text Input
            </label>
            <textarea
              id={textareaId}
              value={state.textInput}
              onChange={(e) => onTextInputChange(e.target.value)}
              className="datauri-textarea"
              aria-label="Text content to convert to data URI"
              placeholder="Paste or type text content here..."
              rows={8}
            />
            <span className="input-char-count">
              {state.textInput.length.toLocaleString()} chars
            </span>
          </div>
        )}

        {state.inputMode === 'file' && (
          <div className="input-group">
            <div
              className={`file-upload-zone${isDragOver ? ' drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label={
                state.fileName
                  ? `Selected file: ${state.fileName}`
                  : 'Click or drag a file to upload'
              }
            >
              <input
                type="file"
                id={fileInputId}
                className="file-input-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileUpload(file);
                }}
                aria-label="Choose a file to convert to data URI"
              />
              <label htmlFor={fileInputId} className="file-upload-label">
                <div className="file-upload-icon" aria-hidden="true">
                  📂
                </div>
                <div className="file-upload-text">
                  {state.fileName ||
                    (isDragOver ? 'Drop file here' : 'Click or drag to choose a file')}
                </div>
                {state.fileSize > 0 && (
                  <div className="file-upload-size">{(state.fileSize / 1024).toFixed(1)} KB</div>
                )}
                {!state.fileName && (
                  <div className="file-upload-hint">Drag &amp; drop or click to browse</div>
                )}
              </label>
            </div>
          </div>
        )}

        {state.inputMode === 'url' && (
          <div className="input-group">
            <input
              type="url"
              value={state.urlInput}
              onChange={(e) => onUrlInputChange(e.target.value)}
              className="datauri-url-input"
              aria-label="URL input"
              placeholder="https://example.com/image.png"
            />
            <div className="input-hint-block">
              <p className="input-hint">
                Fetch content from a URL to convert to a data URI. Due to CORS restrictions, this only works client-side for same-origin or permissive servers.
              </p>
              <p className="input-hint input-hint-alt">
                💡 For external URLs: download the file first and use{' '}
                <strong>File</strong> mode instead.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MIME Type */}
      <div className="sidebar-section">
        <h3>MIME Type</h3>
        <div className="sidebar-column">
          <select
            id={mimeSelectId}
            value={state.selectedMimeType}
            onChange={(e) => onMimeTypeChange(e.target.value as DataUriType)}
            className="datauri-select"
            aria-label="MIME type"
          >
            {DEFAULT_MIME_TYPES.map((mt) => (
              <option key={mt.value} value={mt.value}>
                {mt.label}
              </option>
            ))}
          </select>
          {state.selectedMimeType === 'custom' && (
            <input
              id={customMimeInputId}
              type="text"
              value={state.customMimeType}
              onChange={(e) => onCustomMimeChange(e.target.value)}
              className="datauri-input"
              aria-label="Custom MIME type"
              placeholder="e.g. application/octet-stream"
            />
          )}
        </div>
      </div>

      {/* Encoding Options */}
      <div className="sidebar-section">
        <h3>Encoding</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.isBase64}
            onChange={(e) => onBase64Toggle(e.target.checked)}
            aria-label="Use base64 encoding"
          />
          <span>Base64 encode</span>
        </label>
        {state.inputMode === 'text' && !state.isBase64 && (
          <p className="input-hint">
            Text content is URL-encoded by default. Enable base64 for binary-like text.
          </p>
        )}
      </div>

      {/* Generate & Clear */}
      <div className="sidebar-section sidebar-actions">
        <button
          type="button"
          className="datauri-btn datauri-btn-primary datauri-btn-full"
          onClick={onGenerateUri}
          disabled={
            (state.inputMode === 'text' && !state.textInput) ||
            (state.inputMode === 'file' && !state.fileBytes) ||
            (state.inputMode === 'url' && !state.urlInput)
          }
          aria-label="Generate data URI"
        >
          Generate Data URI
        </button>
        {state.dataUri && (
          <button
            type="button"
            className="datauri-btn datauri-btn-outline datauri-btn-full"
            onClick={onClear}
            aria-label="Clear and start over"
          >
            Clear
          </button>
        )}
      </div>

      {state.error && (
        <div className="sidebar-section" role="alert" aria-live="assertive">
          <div className="error-message">
            <span aria-hidden="true">⚠️</span> {state.error}
          </div>
        </div>
      )}
    </div>
  );
}
