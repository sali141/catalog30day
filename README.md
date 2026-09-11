# Catalog engineering handoff — Day 30 core

This is an isolated, source-first React + TypeScript + Ant Design package. It is
intended to be attached to Slack as one ZIP and opened directly in Cursor. It is
not coupled to the portfolio application and does not import from its parent
repository.

## What engineers receive

- `src/pages/ProductsBundlesPage.tsx` — the current Products & bundles inventory,
  including its All/Telco/Merchandise/Bundles views and the existing product-type
  branch. Merchandise continues through Category and Schema selection.
- `src/pages/ProductListingsPage.tsx` — a functional single-line offer listing
  flow plus the current listing table and Promotions reference/count column.
- `src/pages/RatesPage.tsx` — overage-rate inventory and creation flow.
- `src/theme.ts` and `src/styles.css` — the Circles Ant Design tokens and only
  the layout CSS needed by this package.
- `SCOPE.md` — ticket-derived inclusion and exclusion boundary.
- `dist/` — compiled visual preview. The implementation source is in `src/`.

## Open in Cursor

Unzip the folder, open this folder as the workspace, then give Cursor this prompt:

> Read README.md and SCOPE.md first. Use the React/TypeScript source in src as
> the UI and interaction reference. Keep Ant Design components and the supplied
> theme tokens. Map the mock state to our APIs without adding capabilities that
> SCOPE.md excludes.

## Run locally

Requires Node 20 or newer.

```bash
npm install
npm run verify:scope
npm run dev
```

Build a static preview with `npm run build`. A web server is needed for the
compiled preview; use `npm run preview` rather than double-clicking an HTML file.

## Handoff note

The UI uses actual Ant Design components, typed view models, and working local
state. Its table rows are copied from the current UI so engineers can review the
same inventory; they are still demo data, not API enums. The package is Day 30
core with only two explicitly retained references: the existing Promotions
column/link and the `CCI · Day 60` price-by-line control. Promotion management
code and all other later/future capabilities are excluded.
