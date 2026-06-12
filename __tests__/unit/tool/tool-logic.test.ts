import { describe, it, expect } from 'vitest';
import { createMockToolState } from '@itsjust/core/testing';
import { dataUriTool, buildDataUri } from '@/tool/tool-definition';
import type { DataUriState } from '@/tool/types';

const defaultState: DataUriState = {
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

describe('Data URI Builder logic', () => {
  it('initializes with default state', () => {
    const state = createMockToolState<DataUriState>(defaultState);
    expect(state.data.inputMode).toBe('text');
    expect(state.data.textInput).toBe('');
    expect(state.data.dataUri).toBe('');
  });

  it('builds data URI for plain text (non-base64)', () => {
    const uri = buildDataUri('text/plain', 'Hello World', false);
    expect(uri).toBe('data:text/plain,' + encodeURIComponent('Hello World'));
  });

  it('builds data URI for base64-encoded text content', () => {
    const uri = buildDataUri('text/plain', 'Hello World', true);
    expect(uri).toBe('data:text/plain;base64,' + btoa('Hello World'));
  });

  it('builds data URI for pre-encoded base64 content (file mode)', () => {
    const uri = buildDataUri('image/png', 'iVBORw0KGgo=', false, true);
    expect(uri).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('builds data URI for non-text content without base64 flag (pre-encoded)', () => {
    const uri = buildDataUri('application/json', 'eyJrZXkiOiJ2YWwifQ==', false, true);
    expect(uri).toBe('data:application/json;base64,eyJrZXkiOiJ2YWwifQ==');
  });

  it('builds data URI for unicode text with base64 encoding', () => {
    const uri = buildDataUri('text/plain', 'Hello 世界', true);
    expect(uri).toBe(
      'data:text/plain;base64,' +
        btoa(
          new TextEncoder().encode('Hello 世界').reduce((s, b) => s + String.fromCharCode(b), '')
        )
    );
  });

  it('builds data URI for HTML content', () => {
    const uri = buildDataUri('text/html', '<h1>Title</h1>', false);
    expect(uri).toContain('data:text/html,');
    expect(uri).toContain(encodeURIComponent('<h1>Title</h1>'));
  });

  it('builds data URI for empty content', () => {
    const uri = buildDataUri('text/plain', '', false);
    expect(uri).toBe('data:text/plain,');
  });

  it('builds data URI for empty content with base64', () => {
    const uri = buildDataUri('text/plain', '', true);
    expect(uri).toBe('data:text/plain;base64,');
  });

  it('handles non-Latin1 characters without base64 (non-text mime — pre-encoded)', () => {
    // Non-text mime with non-base64 content passed as pre-encoded
    const uri = buildDataUri('application/octet-stream', '\x00\xFF\xFE', false, true);
    expect(uri).toBe('data:application/octet-stream;base64,\x00\xFF\xFE');
  });

  it('builds data URI for content with special URL characters', () => {
    const uri = buildDataUri('text/plain', 'hello & world = 100%', false);
    expect(uri).toBe('data:text/plain,' + encodeURIComponent('hello & world = 100%'));
    expect(uri).toContain('%20');
    expect(uri).toContain('%3D');
  });

  it('builds data URI for CSS content', () => {
    const css = 'body { background: #fff; color: #000; }';
    const uri = buildDataUri('text/css', css, false);
    expect(uri).toContain('data:text/css,');
    expect(uri).toContain(encodeURIComponent(css));
  });

  it('builds data URI for SVG content (text-type mime — URL-encoded)', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
    const uri = buildDataUri('image/svg+xml', svg, false);
    // image/svg+xml starts with 'image/', not 'text/', so previous behavior
    // assumed pre-encoded base64. Now with the explicit 4th arg, without
    // isPreEncoded=true this gets URL-encoded.
    expect(uri).toContain('data:image/svg+xml,');
    expect(uri).toContain(encodeURIComponent(svg));
  });

  it('supports undo/redo', () => {
    const state = createMockToolState<DataUriState>({
      ...defaultState,
      textInput: 'First',
    });

    state.setData((prev) => ({ ...prev, textInput: 'Second' }));
    expect(state.data.textInput).toBe('Second');
    expect(state.canUndo).toBe(true);

    state.undo();
    expect(state.data.textInput).toBe('First');
    expect(state.canRedo).toBe(true);

    state.redo();
    expect(state.data.textInput).toBe('Second');
  });
});

describe('Data URI Builder deserialize', () => {
  it('accepts valid state object', () => {
    const result = dataUriTool.deserialize(defaultState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inputMode).toBe('text');
    }
  });

  it('rejects null data', () => {
    const result = dataUriTool.deserialize(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid data');
    }
  });

  it('rejects non-object data', () => {
    const result = dataUriTool.deserialize('string');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid data');
    }
  });

  it('rejects object without required fields', () => {
    const result = dataUriTool.deserialize({ someField: 'value' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid data');
    }
  });

  it('serializes state to JSON string', () => {
    const json = dataUriTool.serialize(defaultState);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.inputMode).toBe('text');
    expect(parsed.textInput).toBe('');
  });

  it('round-trips state through serialize/deserialize', () => {
    const stateWithData: DataUriState = {
      ...defaultState,
      inputMode: 'file',
      fileName: 'test.png',
      dataUri: 'data:image/png;base64,abc123',
      isBase64: true,
      fileSize: 1024,
      fileBytes: 'abc123',
    };
    const json = dataUriTool.serialize(stateWithData);
    const parsed = JSON.parse(json);
    const result = dataUriTool.deserialize(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileName).toBe('test.png');
      expect(result.data.isBase64).toBe(true);
      expect(result.data.fileSize).toBe(1024);
    }
  });

  it('rejects object with non-string error field', () => {
    const invalidState = {
      ...defaultState,
      error: 42, // should be a string
    };
    const result = dataUriTool.deserialize(invalidState);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid data');
    }
  });

  it('accepts state with an error string present', () => {
    const errorState: DataUriState = {
      ...defaultState,
      error: 'Something went wrong',
    };
    const result = dataUriTool.deserialize(errorState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.error).toBe('Something went wrong');
    }
  });

  it('rejects state with NaN fileSize', () => {
    const invalidState = {
      ...defaultState,
      fileSize: NaN,
    };
    const result = dataUriTool.deserialize(invalidState);
    expect(result.success).toBe(false);
  });

  it('rejects state with non-boolean isBase64', () => {
    const invalidState = {
      ...defaultState,
      isBase64: 'true',
    };
    const result = dataUriTool.deserialize(invalidState);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid data');
    }
  });

  it('rejects state with missing textInput field', () => {
    const { textInput, ...partial } = defaultState;
    void textInput; // used in destructuring
    const result = dataUriTool.deserialize(partial);
    expect(result.success).toBe(false);
  });

  it('rejects state where inputMode is non-string (number)', () => {
    const invalidState = {
      ...defaultState,
      inputMode: 42,
    };
    const result = dataUriTool.deserialize(invalidState);
    expect(result.success).toBe(false);
  });
});
