import type { ToolConfig } from '@itsjust/core';
import packageJson from '../../package.json';

export const templateBaseVersion = packageJson.version;

const toolConfig = {
  id: 'simple-notepad',
  name: 'Notepad',
  description: 'A clean, distraction-free notepad. Write, edit, and export your notes instantly.',
  version: '1.3.0',
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
    accent: '#10b981',
    accentHover: '#059669',
    accentSubtle: 'rgba(16, 185, 129, 0.08)',
    brand: 'Notepad',
    icon: '\u{1F4DD}',
  },
  shortcuts: [
    {
      title: 'Notepad',
      shortcuts: [
        { keys: 'Ctrl+Shift+E', label: 'Export All', description: 'exports all formats at once' },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
