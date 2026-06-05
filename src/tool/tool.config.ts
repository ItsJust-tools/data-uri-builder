import type { ToolConfig } from '@itsjust/core';
import packageJson from '../../package.json';

export const templateBaseVersion = packageJson.version;

const toolConfig = {
  id: 'data-uri-builder',
  name: 'Data URI Builder',
  description:
    'Convert any file or text into a data URI — paste, upload, or type to get a data: URL. All client-side, privacy-first.',
  version: '1.1.0',
  exportFormats: ['json', 'png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#06b6d4',
    accentHover: '#0891b2',
    accentSubtle: 'rgba(6, 182, 212, 0.08)',
    brand: 'Data URI Builder',
    icon: '\u{1F4E6}',
  },
  shortcuts: [
    {
      title: 'Data URI Builder',
      shortcuts: [
        { keys: 'Ctrl+Shift+E', label: 'Export All', description: 'exports all formats at once' },
        {
          keys: 'Ctrl+Shift+V',
          label: 'Paste from Clipboard',
          description: 'paste text or image from clipboard',
        },
        {
          keys: 'Ctrl+Shift+C',
          label: 'Copy Data URI',
          description: 'copy generated data URI to clipboard',
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
