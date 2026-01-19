# Office and document fixtures

- Created fixtures for doc/docx/html/webpage/dxf in `apps/tools/benchmarks/fixtures/`.
- DOCX generated via pandoc from a small markdown file.
- DOC generated via macOS `textutil` converting the DOCX output.
- PPT fixture still missing because `soffice` (LibreOffice) is not installed on this machine.

Commands used:

```
# DOCX
pandoc -o apps/tools/benchmarks/fixtures/sample.docx /path/to/temp.md

# DOC (requires macOS textutil)
textutil -convert doc apps/tools/benchmarks/fixtures/sample.docx -output apps/tools/benchmarks/fixtures/sample.doc
```

Next step for PPT fixture:

- Install LibreOffice and use `soffice --headless --convert-to ppt` on a simple PPTX file,
  or add a CC0 PPT fixture directly.
