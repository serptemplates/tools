# PDF viewer/editor MVP

- Use the PDF.js viewer bundled with `pdfjs-annotation-extension` for the built-in UI and annotation tools.
  - Viewer assets live at `apps/tools/public/vendor/pdfjs-annotation-extension/web`.
  - PDF.js build assets live at `apps/tools/public/vendor/pdfjs-annotation-extension/build`.
  - The annotation extension script is loaded directly by `viewer.html`.
- The PDF tool wrapper is a minimal iframe embed in `apps/tools/components/PdfTool.tsx`.
  - Hash params are used to set annotation defaults (username, editor active, sidebar open).
  - `ae_get_url` and `ae_post_url` are set to empty strings to suppress missing URL warnings.
