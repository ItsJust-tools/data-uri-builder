'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolShell, useTool, ImportExport } from '@itsjust/core';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
  toolConfig,
  templateBaseVersion,
  dataUriTool,
  buildDataUri,
  ToolCanvas,
  ToolToolbar,
  ToolSidebar,
} from '@/tool';
import type { InputMode, DataUriType, DataUriState } from '@/tool';

/**
 * Generates a data URI string from the current tool state.
 * Validates inputs based on the current mode (text/file/url)
 * and returns either a valid URI or an error message.
 *
 * In file mode, content is already base64-encoded from FileReader,
 * so isBase64 is passed as false to avoid double-encoding.
 *
 * @param state - Current DataUriState with input content and options
 * @returns Object with either a uri string or an error message
 */
function generateDataUri(state: DataUriState): { uri: string; error: string } {
  let mimeType: string = state.selectedMimeType;
  if (mimeType === 'custom') {
    mimeType = state.customMimeType.trim();
    if (!mimeType) return { uri: '', error: 'Please enter a custom MIME type' };
  }

  let content = '';

  if (state.inputMode === 'text') {
    if (!state.textInput) return { uri: '', error: 'Please enter some text content' };
    content = state.textInput;
  } else if (state.inputMode === 'file') {
    if (!state.fileBytes) return { uri: '', error: 'Please upload a file' };
    content = state.fileBytes;
  } else if (state.inputMode === 'url') {
    if (!state.urlInput) return { uri: '', error: 'Please enter a URL' };
    return {
      uri: '',
      error:
        'URL fetching is not supported client-side. Download the file and use File (upload) mode instead.',
    };
  }

  return {
    uri: buildDataUri(
      mimeType,
      content,
      // For file mode, content is already base64-encoded from FileReader.readAsDataURL
      // so we pass isBase64=false to avoid double-encoding
      state.inputMode === 'file' ? false : state.isBase64,
      // Content from file upload is pre-encoded as base64 by FileReader
      state.inputMode === 'file'
    ),
    error: '',
  };
}

/**
 * Clears any previous error when the user modifies inputs.
 * Uses a functional update to avoid unnecessary re-renders when there's no error.
 *
 * @param setter - Tool state setter function from useTool
 */
function clearError(
  setter: React.Dispatch<React.SetStateAction<DataUriState>> | ((prev: DataUriState) => void)
) {
  (setter as (update: (prev: DataUriState) => DataUriState) => void)((prev: DataUriState) => {
    if (prev.error) return { ...prev, error: '' };
    return prev;
  });
}

export default function ToolClient() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const tool = useTool(dataUriTool, canvasRef);
  const setToolData = tool.state.setData;
  const showToast = tool.toast;
  const [isSharing, setIsSharing] = useState(false);
  const hasLoadedSharedState = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth > 768 && toolConfig.features.sidebar
  );

  const title = toolConfig.name;

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Load shared state from URL
  useEffect(() => {
    if (hasLoadedSharedState.current) return;
    hasLoadedSharedState.current = true;
    const params = new URLSearchParams(window.location.search);
    const encodedState = params.get('state');
    if (!encodedState) return;
    try {
      const serialized = decompressFromEncodedURIComponent(encodedState);
      if (!serialized) throw new Error('Invalid shared URL');
      const parsed: unknown = JSON.parse(serialized);
      const deserialized = dataUriTool.deserialize(parsed);
      if (!deserialized.success) throw new Error(deserialized.error);
      setToolData(deserialized.data);
      showToast('Loaded state from shared URL', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load shared URL';
      showToast(message, 'error');
    }
  }, [setToolData, showToast]);

  /**
   * Maps a file extension to its corresponding MIME type.
   * Falls back to 'application/octet-stream' for unknown extensions.
   *
   * @param fileName - The name of the uploaded file
   * @returns The detected DataUriType
   */
  const mimeTypeForFile = useCallback((fileName: string): DataUriType => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, DataUriType> = {
      html: 'text/html',
      css: 'text/css',
      js: 'text/javascript',
      json: 'application/json',
      xml: 'application/xml',
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      pdf: 'application/pdf',
      woff2: 'font/woff2',
      woff: 'font/woff',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm',
    };
    return (mimeMap[ext] || 'application/octet-stream') as DataUriType;
  }, []);

  /**
   * Handles switching the input mode (text/file/url).
   * Clears any existing error before updating state.
   */
  const handleInputModeChange = useCallback(
    (mode: InputMode) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, inputMode: mode }));
    },
    [setToolData]
  );

  /**
   * Handles text input changes from the sidebar textarea.
   * Clears any existing error before updating state.
   */
  const handleTextInputChange = useCallback(
    (text: string) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, textInput: text }));
    },
    [setToolData]
  );

  /**
   * Handles file upload from the sidebar file picker or drag-and-drop.
   * Reads the file as a data URL, extracts the base64 content, and auto-detects
   * the MIME type from the file extension.
   */
  const handleFileUpload = useCallback(
    (file: File) => {
      clearError(setToolData);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // result is a data: URL; extract base64
          const base64 = result.split(',')[1] || '';
          // Auto-detect MIME type from file
          const detectedMime = mimeTypeForFile(file.name);
          setToolData((prev) => ({
            ...prev,
            fileName: file.name,
            fileSize: file.size,
            fileBytes: base64,
            selectedMimeType:
              detectedMime === 'application/octet-stream' ? prev.selectedMimeType : detectedMime,
            // Don't force isBase64: the generate function already handles
            // file mode content as pre-encoded base64 regardless of this flag
          }));
        }
      };
      reader.readAsDataURL(file);
    },
    [setToolData, mimeTypeForFile]
  );

  /**
   * Handles URL input changes from the sidebar URL field.
   * Clears any existing error before updating state.
   */
  const handleUrlInputChange = useCallback(
    (url: string) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, urlInput: url }));
    },
    [setToolData]
  );

  /**
   * Handles MIME type selection changes.
   * Clears any existing error before updating state.
   */
  const handleMimeTypeChange = useCallback(
    (mime: DataUriType) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, selectedMimeType: mime }));
    },
    [setToolData]
  );

  /**
   * Handles custom MIME type text input changes.
   * Clears any existing error before updating state.
   */
  const handleCustomMimeChange = useCallback(
    (mime: string) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, customMimeType: mime }));
    },
    [setToolData]
  );

  /**
   * Handles base64 encoding toggle.
   * Clears any existing error before updating state.
   */
  const handleBase64Toggle = useCallback(
    (isBase64: boolean) => {
      clearError(setToolData);
      setToolData((prev) => ({ ...prev, isBase64 }));
    },
    [setToolData]
  );

  /**
   * Generates the data URI from the current tool state.
   * Validates inputs and shows a toast on success or error.
   * In URL mode, immediately shows an info message since client-side
   * URL fetching is not supported.
   */
  const handleGenerateUri = useCallback(() => {
    const { uri, error } = generateDataUri(tool.state.data);
    if (error) {
      showToast(error, 'error');
      setToolData((prev) => ({ ...prev, dataUri: '', error }));
    } else {
      setToolData((prev) => ({ ...prev, dataUri: uri, error: '' }));
      showToast('Data URI generated!', 'success');
    }
  }, [tool.state.data, showToast, setToolData]);

  /**
   * Resets the tool state to its initial values.
   */
  const handleClear = useCallback(() => {
    setToolData(dataUriTool.initialState);
  }, [setToolData]);

  /**
   * Handles copying the generated data URI to the clipboard.
   * Shows a success or error toast based on the result.
   * Uses the Clipboard API with a fallback for older browsers.
   */
  const handleCopyUri = useCallback(async () => {
    if (!tool.state.data.dataUri) {
      showToast('Nothing to copy — generate a data URI first', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(tool.state.data.dataUri);
      showToast('Data URI copied to clipboard', 'success');
    } catch {
      // Fallback for older browsers or insecure contexts
      try {
        const textarea = document.createElement('textarea');
        textarea.value = tool.state.data.dataUri;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Data URI copied to clipboard', 'success');
      } catch {
        showToast('Failed to copy — your browser may not support clipboard access', 'error');
      }
    }
  }, [tool.state.data.dataUri, showToast]);

  /**
   * Reads text from the clipboard and populates the text input field.
   * Automatically switches to text input mode.
   */
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setToolData((prev) => ({ ...prev, textInput: text, inputMode: 'text' }));
        showToast('Pasted from clipboard', 'success');
      }
    } catch {
      showToast('Could not read from clipboard', 'error');
    }
  }, [setToolData, showToast]);

  // Keyboard shortcuts: Ctrl+Shift+C (copy), Ctrl+Shift+V (paste), Ctrl+Shift+E (export via config)
  useEffect(() => {
    /**
     * Handles keyboard shortcuts for the tool.
     * - Ctrl+Shift+C: Copy data URI to clipboard
     * - Ctrl+Shift+V: Paste text from clipboard
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopyUri();
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          handlePasteFromClipboard();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyUri, handlePasteFromClipboard]);

  // Global drag-and-drop: allow dropping files anywhere on the page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleInputModeChange('file');
        handleFileUpload(file);
        showToast(`File dropped: ${file.name}`, 'success');
      }
    };

    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [handleFileUpload, handleInputModeChange, showToast]);

  /**
   * Creates a shareable URL with the current state compressed into query parameters.
   * Uses the Web Share API if available, otherwise copies the URL to clipboard.
   */
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const serialized = dataUriTool.serialize(tool.state.data);
      const encodedState = compressToEncodedURIComponent(serialized);
      if (!encodedState) throw new Error('Failed to encode state for URL');
      const url = new URL(window.location.href);
      url.searchParams.set('state', encodedState);
      url.searchParams.set('tool', toolConfig.id);
      window.history.replaceState(null, '', url.toString());

      const shareUrl = url.toString();
      if (navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          showToast('Shared URL ready', 'success');
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share URL copied to clipboard', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create share URL';
      showToast(message, 'error');
    } finally {
      setIsSharing(false);
    }
  }, [showToast, tool.state.data, title]);

  const toolbarActions = useMemo(() => tool.toolbarActions, [tool.toolbarActions]);

  const toolbarContent = (
    <>
      <ToolToolbar hasDataUri={!!tool.state.data.dataUri} onCopyUri={handleCopyUri} />
      <ImportExport
        formats={tool.supportedFormats}
        onExport={tool.handleExport}
        onImport={tool.importFromFile}
        isImporting={tool.isImporting}
        onShare={handleShare}
        isSharing={isSharing}
      />
    </>
  );

  const sidebarContent = (
    <ToolSidebar
      state={tool.state.data}
      onInputModeChange={handleInputModeChange}
      onTextInputChange={handleTextInputChange}
      onFileUpload={handleFileUpload}
      onUrlInputChange={handleUrlInputChange}
      onMimeTypeChange={handleMimeTypeChange}
      onCustomMimeChange={handleCustomMimeChange}
      onBase64Toggle={handleBase64Toggle}
      onGenerateUri={handleGenerateUri}
      onClear={handleClear}
    />
  );

  const canvasContent = (
    <ToolCanvas canvasRef={canvasRef} state={tool.state.data} onCopyUri={handleCopyUri} />
  );

  const statusBarContent = (
    <>
      <span
        className={`status-slot status-slot-state ${tool.state.isDirty ? 'status-unsaved' : 'status-saved'}`}
      >
        {tool.state.isDirty ? (
          <>
            <span className="status-saving-dot" />
            Unsaved
          </>
        ) : tool.state.lastSaved ? (
          <>Saved {tool.state.lastSaved}</>
        ) : (
          'Ready'
        )}
      </span>
      {tool.state.data.dataUri && (
        <span className="status-slot status-slot-length">
          {tool.state.data.dataUri.length.toLocaleString()} chars
        </span>
      )}
      {tool.state.data.dataUri && (
        <span className="status-slot status-slot-mime">
          {tool.state.data.selectedMimeType === 'custom'
            ? tool.state.data.customMimeType || 'custom'
            : tool.state.data.selectedMimeType}
        </span>
      )}
      <span className="status-slot status-slot-tool-version">Tool v{toolConfig.version}</span>
      <span className="status-slot status-slot-template-version">
        Template v{templateBaseVersion}
      </span>
    </>
  );

  return (
    <ToolShell
      config={toolConfig}
      actions={toolbarActions}
      sidebarOpen={sidebarOpen}
      onSidebarChange={setSidebarOpen}
      toolbar={toolbarContent}
      sidebar={sidebarContent}
      canvas={canvasContent}
      statusBar={statusBarContent}
    />
  );
}
