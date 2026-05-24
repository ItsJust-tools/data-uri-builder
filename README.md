# Data URI Builder

[![Tool](https://img.shields.io/badge/Tool-Data%20URI%20Builder-06b6d4?style=for-the-badge)](https://github.com/ItsJust-tools/data-uri-builder)

Convert any file or text into a data URI — paste, upload, or type to get a `data:` URL. All client-side, privacy-first.

**Live:** [data-uri-builder.itsjust.tools](https://data-uri-builder.itsjust.tools)

## Features

- **Text to Data URI** — type or paste any text, choose MIME type, get a data: URL
- **File Upload** — drag or upload any file (images, PDFs, fonts, audio, video)
- **MIME Type Selection** — 20+ common MIME types or enter a custom one
- **Base64 Encoding** — toggle base64 encoding on/off
- **Copy & Download** — copy the data URI to clipboard or download as a file
- **Preview** — open the data URI in a new tab to see the result
- **Dark Mode** — respects your system preference
- **No Server** — everything runs in your browser, nothing is uploaded

## How to Use

1. Choose input source: **Text**, **File**, or **URL**
2. Enter your content
3. Select the MIME type (auto-detected for most file types)
4. Toggle base64 encoding if needed
5. Click **Generate Data URI**
6. Copy, download, or preview the result

## Examples

| Input | MIME Type | Output |
|-------|-----------|--------|
| `<h1>Hello</h1>` | text/html | `data:text/html,%3Ch1%3EHello%3C/h1%3E` |
| image.png | image/png | `data:image/png;base64,iVBORw0KGgo...` |
| `{"key":"value"}` | application/json | `data:application/json,%7B%22key%22%3A%22value%22%7D` |

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
