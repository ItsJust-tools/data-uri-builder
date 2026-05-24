import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import ToolClient from '@/app/tool-client';
import ToolClientWrapper from '@/app/tool-client-wrapper';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="dynamic-tool-client">dynamic-tool-client</div>,
}));

const mockSetData = vi.fn();
const mockToast = vi.fn();
const mockHandleExport = vi.fn();
const mockImport = vi.fn();
const mockToolbarActions = { canUndo: true, canRedo: true, onUndo: vi.fn(), onRedo: vi.fn() };

vi.mock('@itsjust/core', () => ({
  ToolShell: ({ toolbar, sidebar, canvas, statusBar }: Record<string, unknown>) => (
    <div>
      <div>{toolbar as ReactNode}</div>
      <div>{sidebar as ReactNode}</div>
      <div>{canvas as ReactNode}</div>
      <div>{statusBar as ReactNode}</div>
    </div>
  ),
  ImportExport: ({ onShare }: { onShare?: () => void }) => (
    <button type="button" onClick={onShare}>
      trigger-share
    </button>
  ),
  useTool: () => ({
    state: {
      data: {
        inputMode: 'text',
        textInput: 'Hello World',
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
      setData: mockSetData,
      isDirty: false,
      lastSaved: 'just now',
    },
    toast: mockToast,
    supportedFormats: ['json'],
    handleExport: mockHandleExport,
    importFromFile: mockImport,
    isImporting: false,
    toolbarActions: mockToolbarActions,
  }),
}));

vi.mock('@/tool', () => ({
  toolConfig: {
    id: 'data-uri-builder',
    name: 'Data URI Builder',
    version: '1.0.0',
    features: { sidebar: true },
    theme: { brand: 'Data URI Builder' },
  },
  templateBaseVersion: '1.4.0',
  dataUriTool: {
    serialize: (state: unknown) => JSON.stringify(state),
    deserialize: () => ({ success: true, data: { inputMode: 'text' } }),
  },
  buildDataUri: (mime: string, content: string, isBase64: boolean) =>
    `data:${mime}${isBase64 ? ';base64' : ''},${isBase64 ? content : encodeURIComponent(content)}`,
  ToolCanvas: ({ state }: { state: { dataUri: string } }) => (
    <div>canvas:{state.dataUri || 'empty'}</div>
  ),
  ToolToolbar: () => <div>toolbar</div>,
  ToolSidebar: () => <div>sidebar</div>,
}));

describe('app client', () => {
  beforeEach(() => {
    mockSetData.mockReset();
    mockToast.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    window.history.replaceState(null, '', 'http://localhost:3000/?state=e30%3D');
  });

  it('renders dynamic tool client wrapper', () => {
    render(<ToolClientWrapper />);
    expect(screen.getByTestId('dynamic-tool-client')).toBeInTheDocument();
  });

  it('renders tool client with default state', () => {
    render(<ToolClient />);
    expect(screen.getByText('toolbar')).toBeInTheDocument();
    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(screen.getByText('canvas:empty')).toBeInTheDocument();
  });

  it('handles share flow in tool client', async () => {
    render(<ToolClient />);

    expect(screen.getByText('toolbar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('trigger-share'));

    expect(mockToast).toHaveBeenCalled();
  });
});
