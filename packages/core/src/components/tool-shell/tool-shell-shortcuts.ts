import { useEffect } from 'react';
import type { ToolbarActions } from './tool-shell-context';
import type { ShortcutGroup, ToolConfig } from '../../types';

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

function modKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}

export function useKeyboardShortcuts(actions: ToolbarActions, onShowShortcuts: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Bare "?" opens the shortcut cheatsheet, matching the toolbar tooltip.
      if (e.key === '?' && !mod && !isTyping) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }

      if (mod) {
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
          e.preventDefault();
          onShowShortcuts();
          return;
        }
        // Shift changes `event.key` to its uppercase form (e.g. "Z"), so compare
        // case-insensitively to keep Ctrl+Shift+Z working as redo.
        switch (e.key.toLowerCase()) {
          case 'z':
            // Inside an editable field the browser's native text undo must win.
            if (isTyping) break;
            e.preventDefault();
            if (e.shiftKey) {
              actions.onRedo?.();
            } else {
              actions.onUndo?.();
            }
            break;
          case 'y':
            if (isTyping) break;
            e.preventDefault();
            actions.onRedo?.();
            break;
          case 's':
            e.preventDefault();
            break;
          case 'b':
            e.preventDefault();
            actions.onToggleSidebar?.();
            break;
          case 'd':
            e.preventDefault();
            actions.onToggleTheme?.();
            break;
          case 'e':
            // Export shortcut: hand control to the tool's default export format.
            if (actions.onExport) {
              e.preventDefault();
              actions.onExport(actions.supportedFormats?.[0] ?? 'json');
            }
            break;
        }
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions, onShowShortcuts]);
}

export function buildDefaultShortcutGroups(config: ToolConfig): ShortcutGroup[] {
  const groups: ShortcutGroup[] = [];

  const general: (typeof groups)[0]['shortcuts'] = [];
  const mod = modKey();
  if (config.features.undoRedo) {
    general.push({ keys: `${mod}+Z`, label: 'Undo' });
    general.push({ keys: `${mod}+${isMac() ? 'Shift+Z' : 'Y'}`, label: 'Redo' });
  }
  general.push({ keys: `${mod}+S`, label: 'Save', description: 'auto-saves anyway' });
  if (general.length) groups.push({ title: 'General', shortcuts: general });

  const actions: (typeof groups)[0]['shortcuts'] = [];
  if (config.features.export) actions.push({ keys: `${mod}+E`, label: 'Export' });
  if (actions.length) groups.push({ title: 'Actions', shortcuts: actions });

  const view: (typeof groups)[0]['shortcuts'] = [];
  if (config.features.sidebar) view.push({ keys: `${mod}+B`, label: 'Toggle sidebar' });
  if (config.features.darkMode) view.push({ keys: `${mod}+D`, label: 'Toggle dark mode' });
  if (view.length) groups.push({ title: 'View', shortcuts: view });

  return groups;
}
