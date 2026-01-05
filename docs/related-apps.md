# Related Apps section

## What it is
Tool landing pages now include a "Related Apps" section below the "Related Tools" section. The section lists apps from apps.serp.co that are relevant to the current tool based on its input/output formats.

## Data source
Related apps are defined in:
- packages/app-core/src/data/related-apps.json

Each entry includes:
- id: unique identifier
- name: display name
- url: destination on apps.serp.co
- formats: list of formats that should trigger the app
- description (optional): short card copy

## Matching logic
The section is rendered when a tool has both a `from` and `to` format. The app list is filtered by matching any format in the app entry against either the tool's `from` or `to` formats (case-insensitive). Apps are de-duplicated by `id`.

## Rendering
The section is implemented in:
- apps/tools/components/sections/RelatedAppsSection.tsx

It is wired into the template here:
- apps/tools/components/ToolPageTemplate.tsx

## Adding a new related app
1. Add a new object to `packages/app-core/src/data/related-apps.json`.
2. Include all formats that should surface the app in `formats`.
3. The section will automatically appear on any matching tool page.
