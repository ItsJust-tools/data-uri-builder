import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCanvas } from '@/tool/components/tool-canvas';
import type { DataUriState } from '@/tool/types';

const baseState: DataUriState = {
  inputMode: 'text',
  textInput: 'hello',
  fileName: '',
  selectedMimeType: 'text/plain',
  customMimeType: '',
  dataUri: '',
  isBase64: false,
  fileSize: 0,
  fileBytes: '',
  error: '',
  optimizeSvg: false,
  urlInput: '',
};

describe('ToolCanvas', () => {
  it('shows empty state when no data URI is generated', () => {
    render(<ToolCanvas state={baseState} />);
    expect(screen.getByText(/Type text, upload a file, or enter a URL/i)).toBeInTheDocument();
  });

  it('shows overhead stats when data URI is larger than original content', () => {
    const state: DataUriState = {
      ...baseState,
      dataUri: 'data:text/plain,hello-world-longer',
      fileSize: 5,
    };
    render(<ToolCanvas state={state} />);
    expect(screen.getByText(/overhead/i)).toBeInTheDocument();
  });

  it('shows saved stats when data URI is smaller than original content', () => {
    const state: DataUriState = {
      ...baseState,
      dataUri: 'data:text/plain,x',
      textInput: 'a-much-longer-input-string',
    };
    render(<ToolCanvas state={state} />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('calls onCopyUri when copy button is clicked', () => {
    const onCopyUri = vi.fn();
    const state: DataUriState = {
      ...baseState,
      dataUri: 'data:text/plain,hello',
      isBase64: true,
    };
    render(<ToolCanvas state={state} onCopyUri={onCopyUri} />);
    expect(screen.getByText(/Base64 encoded/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Copy data URI/i }));
    expect(onCopyUri).toHaveBeenCalledOnce();
  });

  it('renders copy-as-CSS and copy-as-HTML buttons', () => {
    const onCopyAsCss = vi.fn();
    const onCopyAsHtml = vi.fn();
    const onCopyUri = vi.fn();
    const state: DataUriState = {
      ...baseState,
      dataUri: 'data:image/png;base64,AAA',
      selectedMimeType: 'image/png',
    };
    render(
      <ToolCanvas
        state={state}
        onCopyUri={onCopyUri}
        onCopyAsCss={onCopyAsCss}
        onCopyAsHtml={onCopyAsHtml}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Copy as CSS/i }));
    fireEvent.click(screen.getByRole('button', { name: /Copy as HTML/i }));
    expect(onCopyAsCss).toHaveBeenCalledOnce();
    expect(onCopyAsHtml).toHaveBeenCalledOnce();
    expect(onCopyUri).not.toHaveBeenCalled();
  });

  it('hides copy-as buttons when no data URI exists (empty state)', () => {
    render(<ToolCanvas state={baseState} onCopyAsCss={vi.fn()} onCopyAsHtml={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Copy as CSS/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy as HTML/i })).not.toBeInTheDocument();
  });
});
