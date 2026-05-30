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

function generateDataUri(state: DataUriState): { uri: string; error: string } {
  let mimeType = state.selectedMimeType;
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
    return { uri: '', error: 'URL fetching is not available in client-side mode. Please download the file and use file mode.' };
  }

  return { uri: buildDataUri(mimeType, content, state.isBase64 && state.inputMode !== 'text' ? false : state.isBase64), error: '' };
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

  // Set default MIME type based on uploaded file extension
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

  const handleInputModeChange = useCallback(
    (mode: InputMode) => {
      setToolData((prev) => ({ ...prev, inputMode: mode }));
    },
    [setToolData]
  );

  const handleTextInputChange = useCallback(
    (text: string) => {
      setToolData((prev) => ({ ...prev, textInput: text }));
    },
    [setToolData]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
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
            selectedMimeType: detectedMime === 'application/octet-stream' ? prev.selectedMimeType : detectedMime,
            isBase64: true,
          }));
        }
      };
      reader.readAsDataURL(file);
    },
    [setToolData, mimeTypeForFile]
  );

  const handleUrlInputChange = useCallback(
    (url: string) => {
      setToolData((prev) => ({ ...prev, urlInput: url }));
    },
    [setToolData]
  );

  const handleMimeTypeChange = useCallback(
    (mime: DataUriType) => {
      setToolData((prev) => ({ ...prev, selectedMimeType: mime }));
    },
    [setToolData]
  );

  const handleCustomMimeChange = useCallback(
    (mime: string) => {
      setToolData((prev) => ({ ...prev, customMimeType: mime }));
    },
    [setToolData]
  );

  const handleBase64Toggle = useCallback(
    (isBase64: boolean) => {
      setToolData((prev) => ({ ...prev, isBase64 }));
    },
    [setToolData]
  );

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

  const handleClear = useCallback(() => {
    setToolData(dataUriTool.initialState);
  }, [setToolData]);

  const handleCopyUri = useCallback(async () => {
    if (tool.state.data.dataUri) {
      await navigator.clipboard.writeText(tool.state.data.dataUri);
      showToast('Data URI copied to clipboard', 'success');
    }
  }, [tool.state.data.dataUri, showToast]);

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
      <ToolToolbar />
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
    <ToolCanvas
      canvasRef={canvasRef}
      state={tool.state.data}
      onCopyUri={handleCopyUri}
    />
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
