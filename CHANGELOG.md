# Changelog

## [Unreleased]

### Added

- **Docker container health check**: The runtime stage now declares a `HEALTHCHECK` that polls `http://127.0.0.1:3000/` every 30s (`--start-period=10s`, 3 retries), so orchestrators can detect a wedged server instead of reporting the container as healthy. The probe targets the IPv4 loopback because the server binds `HOSTNAME=0.0.0.0` while BusyBox `wget` resolves `localhost` to `::1` without falling back
- **Full Playwright E2E suite**: Core user workflows now have E2E coverage — state persistence across reload (including shared `?state=` URLs and corrupt-storage recovery), keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`, `Ctrl+S`, `Ctrl+B`, `Ctrl+D`, `Ctrl+Shift+C`, `?`, `Delete`), export payload verification (JSON round-trip plus PNG signature), import and drag-and-drop flows, and dark/light theme persistence
- **Image paste from clipboard**: `Ctrl+Shift+V` now also handles pasting images from the clipboard, automatically switching to file mode and detecting the MIME type
- **Clear resets shared-state flag**: Clearing the tool state now also resets the shared-state-loading flag so a new shared URL can be loaded after clearing
- **Keyboard shortcuts in README**: Added keyboard shortcuts table documenting `Ctrl+Shift+C`, `Ctrl+Shift+V`, `Delete`/`Backspace`, `Tab`, and `Escape` shortcuts
- **Title attributes on stat badges**: Added tooltip titles to character count and overhead badges for additional context on hover
- **Title attribute on output textarea**: Shows data URI character count on hover

### Changed

- **Copy URI button in toolbar**: Added an actionable "Copy URI" button next to shortcut hints when a data URI has been generated, making the copy function accessible via click as well as keyboard
- **Improved URL mode UX**: Generate button now shows "URL mode is not available (use File mode)" instead of a generic label when a URL is entered, making the limitation clearer
- **Fixed misleading isBase64 state**: Removed forced `isBase64: true` in file upload handler — the generate function already treats file mode content as pre-encoded base64, so forcing the flag was confusing and out of sync with actual behavior

### Fixed

- **Silent import failures**: Unreadable or rejected import files now raise an error toast instead of failing without feedback, and successful imports confirm with an "Imported state" toast
- **Redo via `Ctrl+Shift+Z` was unreachable**: The shortcut handler matched only lowercase `z`, but Shift produces `"Z"`, so redo never dispatched
- **Undo blocked native text undo in inputs**: `Ctrl+Z`/`Ctrl+Y` are now left to the browser while focus is inside an editable field, and no longer hijack caret-level undo
- **First undo appeared to do nothing**: `setData` recorded a history entry even when the update produced an identical state (e.g. clearing an already-empty error), so undo needed two presses; no-op updates no longer touch history, and the state updater stays pure under React StrictMode
- **Advertised `Ctrl+D` did nothing**: Dark-mode shortcut listed in the shortcut overlay but never implemented; it now toggles the theme
- **Bare `?` did not open shortcuts**: The cheatsheet claimed `?` toggles the overlay, but only `Ctrl+?` worked
- **Missing `font/otf` extension mapping**: Added `font/otf` → `.otf` to the download extension map in `tool-canvas.tsx`
- **Missing `otf` MIME detection**: Added `otf` → `font/otf` to the file extension MIME type map in `tool-client.tsx`
- **Parse error in sidebar JSX**: Removed stray closing braces that caused a build failure in the tool-sidebar component

### Docs

- **Fix misleading `buildDataUri` JSDoc**: Updated the documentation to accurately describe the actual behavior when `isBase64` is false
- **Add Clipboard Paste to README features**: Documented the new image paste capability
- **Expand README**: Added keyboard shortcuts table, expanded Features with size statistics, expanded Limitations with custom MIME type guidance

## [1.1.0] — 2026-06-03

### Added

- **Keyboard shortcuts**: `Ctrl+Shift+C` to copy the generated data URI, `Ctrl+Shift+V` to paste text from clipboard into the text input
- **Toolbar keyboard hints**: When a data URI is generated, the toolbar shows `Ctrl+Shift+C` and `Ctrl+Shift+V` shortcut hints
- **Error auto-clear**: Previous error messages are now automatically cleared when the user modifies any input (text, file, URL, MIME type, or encoding setting)

### Changed

- **CSS cleanup**: Removed unused Notepad template CSS classes from globals.css, saving CSS bundle size
- **Drag-and-drop feedback**: Added enhanced visual feedback when dragging files over the upload zone
- **Print/export styles**: Replaced Notepad-specific print styles with Data URI Builder-specific rules

## [1.0.0] — 2026-05-24

### Initial Release

- **Text to Data URI**: Type or paste text content, choose MIME type, get a data: URL
- **File Upload**: Upload files (images, PDFs, fonts, audio, video) with auto-detected MIME types
- **URL Input**: Enter a URL to fetch content (CORS permitting)
- **20+ MIME Types**: Pre-configured common MIME types plus custom entry
- **Base64 Encoding**: Toggle base64 encoding on/off for any input
- **Copy to Clipboard**: One-click copy of generated data URI
- **Download**: Download the content as a file from the data URI
- **Preview**: Open data URI in a new tab
- **Sharing**: Share state via URL (compressed)
- **Export**: Export the tool state as JSON
- **Dark Mode**: Respects system preference via template
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **100% Client-Side**: No data leaves your browser — privacy first
