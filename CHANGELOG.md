# Changelog

## [Unreleased]

### Added

- **Copy URI button in toolbar**: Added an actionable "Copy URI" button next to shortcut hints when a data URI has been generated, making the copy function accessible via click as well as keyboard

### Changed

- **package.json metadata**: Added missing `homepage`, `bugs`, and `keywords` fields for better npm ecosystem discoverability

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
