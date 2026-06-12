# Data URI Builder

![Tool](https://img.shields.io/badge/Tool-Data%20URI%20Builder-06b6d4?style=for-the-badge)
[![CI](https://github.com/ItsJust-tools/data-uri-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsJust-tools/data-uri-builder/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Convert any file or text into a data URI — paste, upload, or type to get a `data:` URL. All client-side, privacy-first.

**Live:** [data-uri-builder.itsjust.tools](https://data-uri-builder.itsjust.tools)

## Features

- **Text to Data URI** — type or paste any text, choose MIME type, get a data: URL
- **File Upload** — drag or upload any file (images, PDFs, fonts, audio, video)
- **MIME Type Selection** — 20+ common MIME types or enter a custom one
- **Base64 Encoding** — toggle base64 encoding on/off
- **Copy & Download** — copy the data URI to clipboard or download as a file with auto-detected extension based on MIME type
- **Preview** — open the data URI in a new tab to see the result
- **Size Statistics** — shows character count, encoding overhead/savings ratio, and original vs. encoded size comparison
- **Keyboard Friendly** — full keyboard navigation for all controls
- **Dark Mode** — respects your system preference
- **High Contrast Support** — accessible in high-contrast mode
- **No Server** — everything runs in your browser, nothing is uploaded

## Keyboard Shortcuts

| Shortcut             | Action                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `Ctrl+Shift+C`       | Copy data URI to clipboard                                       |
| `Ctrl+Shift+V`       | Paste text from clipboard                                        |
| `Ctrl+Shift+E`       | Export tool state in all formats                                 |
| `Delete`/`Backspace` | Clear all input and generated URI (when not focused in an input) |
| `Escape`             | Close sidebar panel                                              |

## How to Use

1. Choose input source: **Text**, **File**, or **URL**
2. Enter your content
3. Select the MIME type (auto-detected for most file types)
4. Toggle base64 encoding if needed
5. Click **Generate Data URI**
6. Copy, download, or preview the result

## Limitations

- **URL mode** is client-side only and subject to CORS restrictions. Download the file first and use **File** (upload) mode for reliable results from external URLs.
- **Base64** is automatically used for file uploads (FileReader provides base64). Toggle it off for text inputs to produce smaller, URL-encoded URIs.
- **Blob size** directly impacts the data URI length. Very large files (several MB) may affect browser performance and memory usage.
- **Custom MIME types** can be entered manually — useful for niche formats not in the preset list (e.g. `application/x-font-ttf`, `model/gltf+json`).

## Examples

| Input             | MIME Type        | Output                                                |
| ----------------- | ---------------- | ----------------------------------------------------- |
| `<h1>Hello</h1>`  | text/html        | `data:text/html,%3Ch1%3EHello%3C/h1%3E`               |
| image.png         | image/png        | `data:image/png;base64,iVBORw0KGgo...`                |
| `{"key":"value"}` | application/json | `data:application/json,%7B%22key%22%3A%22value%22%7D` |

## Drag & Drop

Drag any file from your file manager directly onto the page or into the file upload zone. The tool automatically switches to File mode and detects the MIME type from the file extension.

## Sharing State

You can share your current tool state via a compressed URL:

1. Click the **Share** button in the toolbar
2. A URL containing your current configuration is copied to your clipboard
3. Share the URL with anyone — they'll see the same data URI setup when they open it

**Note:** Shared state only persists in the URL. Close the page and the data is not stored anywhere.

## Development

```bash
npm install
npm run dev
```

### Tests

```bash
npm test            # unit tests
npm run test:e2e    # E2E tests
```

## License

MIT
