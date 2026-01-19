# Tools dev server: missing @tailwindcss/postcss

If `pnpm -C apps/tools dev` fails with `Cannot find module '@tailwindcss/postcss'`, add `@tailwindcss/postcss` to `apps/tools/package.json` devDependencies and run `pnpm install`.

This is required because `apps/tools/postcss.config.mjs` re-exports `@serp-tools/ui/postcss.config`, which uses the Tailwind v4 PostCSS plugin.
