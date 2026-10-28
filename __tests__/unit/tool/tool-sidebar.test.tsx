import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent, within } from '@testing-library/react';
import { ToolSidebar } from '@/tool/components/tool-sidebar';
import type { DataUriState } from '@/tool/types';

const baseState: DataUriState = {
  inputMode: 'text',
  textInput: '',
  fileName: '',
  selectedMimeType: 'text/plain',
  customMimeType: '',
  dataUri: '',
  isBase64: false,
  fileSize: 0,
  fileBytes: '',
  error: '',
  urlInput: '',
};

function renderSidebar(overrides: Partial<DataUriState> = {}) {
  const handlers = {
    onInputModeChange: vi.fn(),
    onTextInputChange: vi.fn(),
    onFileUpload: vi.fn(),
    onUrlInputChange: vi.fn(),
    onMimeTypeChange: vi.fn(),
    onCustomMimeChange: vi.fn(),
    onBase64Toggle: vi.fn(),
    onGenerateUri: vi.fn(),
    onClear: vi.fn(),
  };
  render(<ToolSidebar state={{ ...baseState, ...overrides }} {...handlers} />);
  return handlers;
}

function dropZone() {
  return screen.getByRole('button', { name: /drag a file to upload|Selected file/i });
}

describe('ToolSidebar', () => {
  it('renders the text input for text mode', () => {
    const handlers = renderSidebar();
    const textarea = screen.getByRole('textbox', {
      name: 'Text content to convert to data URI',
    });
    fireEvent.change(textarea, { target: { value: 'typed' } });
    expect(handlers.onTextInputChange).toHaveBeenCalledWith('typed');
  });

  it('switches input modes from the tab list', () => {
    const handlers = renderSidebar();
    fireEvent.click(screen.getByRole('tab', { name: 'file input' }));
    expect(handlers.onInputModeChange).toHaveBeenCalledWith('file');
    fireEvent.click(screen.getByRole('tab', { name: 'url input' }));
    expect(handlers.onInputModeChange).toHaveBeenCalledWith('url');
  });

  it('disables Generate until text content exists', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: 'Generate data URI' })).toBeDisabled();
  });

  it('enables Generate once text content exists', () => {
    const handlers = renderSidebar({ textInput: 'ready' });
    const generate = screen.getByRole('button', { name: 'Generate data URI' });
    expect(generate).toBeEnabled();
    fireEvent.click(generate);
    expect(handlers.onGenerateUri).toHaveBeenCalledOnce();
  });

  it('calls onGenerateUri when Generate is clicked', () => {
    const handlers = renderSidebar({ textInput: 'ready' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate data URI' }));
    expect(handlers.onGenerateUri).toHaveBeenCalledOnce();
  });

  it('shows the clear button only after a URI exists', () => {
    const handlers = renderSidebar({ textInput: 'ready', dataUri: 'data:text/plain,ready' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear and start over' }));
    expect(handlers.onClear).toHaveBeenCalledOnce();
  });

  it('updates the MIME type and reveals the custom field', () => {
    const handlers = renderSidebar();
    fireEvent.change(screen.getByRole('combobox', { name: 'MIME type' }), {
      target: { value: 'image/png' },
    });
    expect(handlers.onMimeTypeChange).toHaveBeenCalledWith('image/png');
  });

  it('renders the custom MIME input when custom is selected', () => {
    const handlers = renderSidebar({ selectedMimeType: 'custom' });
    const custom = screen.getByRole('textbox', { name: 'Custom MIME type' });
    fireEvent.change(custom, { target: { value: 'text/markdown' } });
    expect(handlers.onCustomMimeChange).toHaveBeenCalledWith('text/markdown');
  });

  it('toggles base64 encoding', () => {
    const handlers = renderSidebar();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use base64 encoding' }));
    expect(handlers.onBase64Toggle).toHaveBeenCalledWith(true);
  });

  it('documents that text is URL-encoded unless base64 is on', () => {
    renderSidebar({ textInput: 'x' });
    expect(screen.getByText(/URL-encoded by default/i)).toBeInTheDocument();
  });

  it('hides the URL-encoding hint when base64 is enabled', () => {
    renderSidebar({ textInput: 'x', isBase64: true });
    expect(screen.queryByText(/URL-encoded by default/i)).not.toBeInTheDocument();
  });

  it('renders the URL input and CORS notice in url mode', () => {
    const handlers = renderSidebar({ inputMode: 'url' });
    const urlInput = screen.getByRole('textbox', { name: 'URL input' });
    fireEvent.change(urlInput, { target: { value: 'https://example.com/a.png' } });
    expect(handlers.onUrlInputChange).toHaveBeenCalledWith('https://example.com/a.png');
    expect(screen.getByText(/client-side only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate data URI' })).not.toBeInTheDocument();
  });

  it('shows the selected file name and size in file mode', () => {
    renderSidebar({
      inputMode: 'file',
      fileName: 'notes.txt',
      fileSize: 2048,
      fileBytes: 'aGVsbG8=',
    });
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('formats sub-kilobyte file sizes in bytes', () => {
    renderSidebar({ inputMode: 'file', fileName: 'tiny.txt', fileSize: 512 });
    expect(screen.getByText('512 B')).toBeInTheDocument();
  });

  it('formats megabyte file sizes', () => {
    renderSidebar({ inputMode: 'file', fileName: 'big.bin', fileSize: 3 * 1024 * 1024 });
    expect(screen.getByText('3.0 MB')).toBeInTheDocument();
  });

  it('uploads a file chosen through the hidden input', () => {
    const handlers = renderSidebar({ inputMode: 'file' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(handlers.onFileUpload).toHaveBeenCalledWith(file);
  });

  it('uploads a dropped file from the drop zone', () => {
    const handlers = renderSidebar({ inputMode: 'file' });
    const file = new File(['dropped'], 'dropped.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone(), { dataTransfer: { files: [file] } });
    expect(handlers.onFileUpload).toHaveBeenCalledWith(file);
    expect(handlers.onGenerateUri).not.toHaveBeenCalled();
  });

  it('highlights the drop zone while dragging over and clears it on leave', () => {
    renderSidebar({ inputMode: 'file' });
    const zone = dropZone();

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone.className).toContain('drag-over');
    expect(screen.getByText('Drop file here')).toBeInTheDocument();

    fireEvent.dragLeave(zone, { dataTransfer: { files: [] } });
    expect(zone.className).not.toContain('drag-over');
  });

  it('ignores a drop with no files', () => {
    const handlers = renderSidebar({ inputMode: 'file' });
    fireEvent.drop(dropZone(), { dataTransfer: { files: [] } });
    expect(handlers.onFileUpload).not.toHaveBeenCalled();
    expect(handlers.onInputModeChange).not.toHaveBeenCalled();
  });

  it('opens the file picker with Enter and Space on the drop zone', () => {
    renderSidebar({ inputMode: 'file' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.keyDown(dropZone(), { key: 'Enter' });
    fireEvent.keyDown(dropZone(), { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(dropZone(), { key: 'a' });
    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });

  it('announces the selected file through the drop zone label', () => {
    renderSidebar({ inputMode: 'file', fileName: 'chosen.css' });
    expect(screen.getByRole('button', { name: /Selected file: chosen\.css/i })).toBeInTheDocument();
  });

  it('does not treat a drag event without files as a file drop', () => {
    const handlers = renderSidebar({ inputMode: 'file' });
    const event = createEvent.drop(dropZone());
    Object.defineProperty(event, 'dataTransfer', { value: {} });
    fireEvent(dropZone(), event);
    expect(handlers.onFileUpload).not.toHaveBeenCalled();
  });

  it('does not re-request file mode when a file is dropped in file mode', () => {
    const handlers = renderSidebar({ inputMode: 'file' });
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone(), { dataTransfer: { files: [file] } });
    expect(handlers.onInputModeChange).not.toHaveBeenCalled();
    expect(handlers.onFileUpload).toHaveBeenCalledWith(file);
  });

  it('renders an accessible alert when the tool reports an error', () => {
    renderSidebar({ error: 'Please enter some text content' });
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/Please enter some text content/)).toBeInTheDocument();
  });

  it('shows the character count for the current text', () => {
    renderSidebar({ textInput: 'abcd' });
    expect(screen.getByText('4 chars')).toBeInTheDocument();
  });
});
