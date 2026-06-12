import type { Metadata } from 'next';
import Link from 'next/link';
import toolConfig from '@/tool/tool.config';

export const metadata: Metadata = {
  title: `Help — ${toolConfig.name}`,
  description: 'How to use the Data URI Builder: convert any file or text into a data: URL. All client-side, privacy-first.',
};

export default function HelpPage() {
  return (
    <div className="help-page">
      <div className="help-card">
        <Link href="/" className="help-back-link" aria-label="Back to tool">
          ← Back to {toolConfig.name}
        </Link>
        <h1 className="help-title">How to Use the Data URI Builder</h1>

        <section className="help-section">
          <h2>What is a Data URI?</h2>
          <p>
            A Data URI embeds a small file directly into a URL string. Instead of linking to an external resource, the data is
            included inline:
          </p>
          <pre className="help-code">data:[&lt;mediatype&gt;][;base64],&lt;data&gt;</pre>
          <p>
            Use it for small images, CSS sprites, fonts, or any content you want to embed directly in HTML, CSS, or JavaScript.
          </p>
        </section>

        <section className="help-section">
          <h2>Quick Start</h2>
          <ol className="help-steps">
            <li>
              <strong>Choose input source</strong> — Select <strong>Text</strong>, <strong>File</strong>, or <strong>URL</strong> from the input mode tabs.
            </li>
            <li>
              <strong>Enter content</strong> — Type or paste text, upload a file (drag &amp; drop supported), or enter a URL.
            </li>
            <li>
              <strong>Select MIME type</strong> — The correct type is often auto-detected. Choose from 20+ common types or enter a custom one.
            </li>
            <li>
              <strong>Configure encoding</strong> — Base64 is automatic for files. Toggle it on or off for text inputs.
            </li>
            <li>
              <strong>Generate</strong> — Click &quot;Generate Data URI&quot; to produce your <code>data:</code> URL.
            </li>
            <li>
              <strong>Copy, download, or preview</strong> — Use the action buttons below the generated URI.
            </li>
          </ol>
        </section>

        <section className="help-section">
          <h2>Input Modes</h2>
          <div className="help-category-grid">
            <div className="help-category">
              <h3>📝 Text</h3>
              <p>Type or paste any text content. Best for HTML, CSS, JavaScript, JSON, XML, SVG, and plain text. Supports URL encoding (default) or base64 encoding.</p>
            </div>
            <div className="help-category">
              <h3>📁 File</h3>
              <p>Upload any file — images (PNG, JPEG, WebP, GIF, SVG), documents (PDF), fonts (WOFF2, WOFF), audio (MP3, OGG), video (MP4, WebM). MIME type is auto-detected from the file extension.</p>
            </div>
            <div className="help-category">
              <h3>🔗 URL</h3>
              <p>Enter a URL to fetch content from. Due to browser CORS restrictions, most external URLs won&apos;t work client-side. Download the file first and use File mode for external resources.</p>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Encoding</h2>
          <ul className="help-tips">
            <li><strong>URL encoding</strong> (default for text) — Non-ASCII characters are percent-encoded. Produces compact, readable URIs for text content.</li>
            <li><strong>Base64 encoding</strong> — Binary data is base64-encoded. Required for files and binary content. Produces ~33% larger output than the original binary.</li>
            <li><strong>File mode</strong> always uses base64 encoding automatically. The toggle is visible but the content is already pre-encoded.</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Tips</h2>
          <ul className="help-tips">
            <li><strong>Keep URIs small</strong> — Data URIs over ~32 KB impact page load performance. For large files, use a real URL or file hosting.</li>
            <li><strong>Use URL encoding for text</strong> — It produces smaller URIs than base64 for text content (no 33% overhead).</li>
            <li><strong>Use base64 for binary files</strong> — Images, fonts, PDFs, audio, and video must use base64 encoding.</li>
            <li><strong>Drag &amp; drop</strong> — You can drag a file from your file manager directly onto the sidebar or anywhere on the page.</li>
            <li><strong>Keyboard shortcuts</strong> — Use <kbd>Ctrl+Shift+C</kbd> to copy the data URI, <kbd>Ctrl+Shift+V</kbd> to paste text from clipboard, and <kbd>Ctrl+Shift+E</kbd> to export the tool state.</li>
            <li><strong>Share via URL</strong> — Use the share button to encode the current state into the URL. Send it to others.</li>
            <li><strong>Dark mode</strong> — The tool follows your system preference. Toggle manually with the theme button.</li>
          </ul>
        </section>

        <section className="help-section">
          <h2>Privacy</h2>
          <p>This tool runs entirely in your browser. No data is sent to any server. Your text, files, and generated data URIs never leave your device.</p>
        </section>

        <section className="help-section">
          <h2>Need More Help?</h2>
          <p>
            Report issues or suggest improvements on the{' '}
            <a href="https://github.com/ItsJust-tools/data-uri-builder/issues" target="_blank" rel="noopener noreferrer">
              GitHub issue tracker
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}