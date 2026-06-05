# Data URI Builder — User Guide

## What is a Data URI?

A Data URI (Uniform Resource Identifier) is a way to embed small files directly in web pages and applications. Instead of linking to an external file, the file content is included as a string of text directly in the URI:

```
data:[<mime-type>][;base64],<data>
```

## Quick Start

1. **Open the tool** — navigate to [data-uri-builder.itsjust.tools](https://data-uri-builder.itsjust.tools)
2. **Choose input mode** — pick Text, File, or URL from the tabs
3. **Enter content** — type text, upload a file, or paste a URL
4. **Select MIME type** — choose from the dropdown or enter a custom type
5. **Set encoding** — enable/disable base64 encoding
6. **Generate** — click the "Generate Data URI" button
7. **Use the result** — copy to clipboard, download, or preview

## Input Modes

### Text Mode

Type or paste any text content. Best for HTML, CSS, JavaScript, JSON, XML, SVG, and plain text.

### File Mode

Upload any file. Works with images (PNG, JPEG, WebP, GIF, SVG), documents (PDF), fonts (WOFF2, WOFF), audio (MP3, OGG), and video (MP4, WebM). MIME type is auto-detected from the file extension.

### URL Mode

Enter a URL to fetch content from. Note: Most servers block cross-origin requests (CORS), so you may need to download the file first and use File mode instead.

## MIME Types

The tool provides 20+ common MIME types:

- Text: text/plain, text/html, text/css, text/javascript
- Data: application/json, application/xml
- Images: image/png, image/jpeg, image/webp, image/gif, image/svg+xml
- Documents: application/pdf
- Fonts: font/woff2, font/woff
- Audio: audio/mpeg, audio/ogg
- Video: video/mp4, video/webm
- Custom: enter any MIME type manually

## Encoding

- **URL Encoding** (default for text): Non-ASCII characters are percent-encoded. Compact and readable for text content.
- **Base64 Encoding**: Binary data is base64-encoded. Required for files and binary content. Produces larger output (~33% overhead).

## Tips

- Data URIs should be under ~32KB for optimal performance
- For large files, consider using a URL or file hosting instead
- Use base64 for binary files like images, fonts, and PDFs
- Use URL encoding for text content — more compact and readable
- Data URIs are cached as part of the page they're embedded in
