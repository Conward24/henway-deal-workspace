# Reference: Mike's shared materials

This folder can hold **Magnolia Company – Henway** reference materials (deals and templates) for building and testing the app.

## How to use

1. Unzip **Magnolia Company - Henway-20260226T221033Z-1-001.zip** into `reference/magnolia-materials/` (or keep the zip elsewhere and refer to it when needed).
2. If the contents are confidential, add `reference/magnolia-materials/` to `.gitignore`.

## Artifacts and usage

| Artifact | Use |
|----------|-----|
| **CIM PDFs** (e.g. `Deals/67467 - BP Magnetics/67467 CIM - Bridgeport Magnetics Group.pdf`) | Design and test the CIM extract prompt. Copy-paste financial sections into .txt for prompt design, or use PDF-to-text offline to get sample input for `/api/extract-cim`. |
| **Barlow & Williams LOI Template.docx** | Define placeholders for the in-app LOI draft (purchase price, multiple, EBITDA, deal name). |
| **LOI - BP Magnetics 3.5x OCF.docx** | Real filled LOI; validate draft output structure. |
| **Live Oak External Cash Flow Model.xlsx** and deal copies | Confirm app data model (revenue, EBITDA, addbacks, financing, DSCR) matches Mike’s inputs/outputs. Document mapping here if needed. |
| **BP Exec Summary Example.docx** | Post-MVP: executive summary / bank memo template. |
