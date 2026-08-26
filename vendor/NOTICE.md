# Vendored libraries

Bundled locally so receipt scanning works without any third-party network calls at runtime.

- **pdf.js** (`pdfjs/`) — Mozilla, Apache-2.0. https://github.com/mozilla/pdf.js
- **Tesseract.js** (`tesseract/`) — Project Naptha, Apache-2.0. https://github.com/naptha/tesseract.js
- **Tesseract trained data** (`tesseract/lang/*.traineddata.gz`) — tessdata_fast, Apache-2.0. https://github.com/tesseract-ocr/tessdata_fast (mirrored via naptha/tessdata)

Versions: pdfjs-dist 3.11.174, tesseract.js 5.1.1, tesseract.js-core 5.1.1 (simd-lstm build).
