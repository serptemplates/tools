# Category Pages

- Canonical tool category route pattern is `/category/{operation}/`.
- Category hub route is `/categories/` and should link to every active operation category page.
- `{operation}` must use the canonical registry operation value, not the user-facing label.
- Current category pages are generated for each active operation in the tool registry: `convert`, `download`, `compress`, `combine`, `bulk`, `edit`, and `view`.
- Category page metadata should use the shared category metadata builder in `apps/tools/lib/metadata.ts`.
- Category sitemap paths are generated from the same registry-backed operation list in `apps/tools/lib/sitemap.ts`.
- Homepage tool cards and category pages should share the same directory helper so tool counts, category labels, and card data stay in sync.
- When category pages render `ToolCard` from a Server Component route, keep the directory payload plain-data only. Resolve icon components client-side from the tool id instead of passing icon functions through props.
