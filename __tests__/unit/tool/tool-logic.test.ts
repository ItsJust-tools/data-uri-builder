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

  it('builds data URI for base64 content', () => {
    const uri = buildDataUri('image/png', 'iVBORw0KGgo=', true);
    expect(uri).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('builds data URI for HTML content', () => {
    const uri = buildDataUri('text/html', '<h1>Title</h1>', false);
    expect(uri).toContain('data:text/html,');
    expect(uri).toContain(encodeURIComponent('<h1>Title</h1>'));
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
});
