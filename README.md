# HeyCileng Agtech — Frontend

Agricultural by-product marketplace connecting suppliers (farmers, cooperatives, agro-processors) with businesses that use by-products as raw materials.

This is a **frontend-only** build. It is separate from the original HeyCileng application.

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · React Router · Lucide icons · Recharts · clsx · self-hosted Bricolage Grotesque + Public Sans.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: enable Demo Preview Mode
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and produce a production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project layout

```
src/
  config/      env + app configuration
  styles/      Tailwind import, design tokens, light/dark themes
  context/     React providers (theme, …)
  hooks/       reusable hooks
  lib/         pure utilities
  components/  ui/ (design system), layout/, shared/
  pages/       route-level pages
```

Further folders (`types/`, `services/`, `fixtures/demo/`, `features/`) are added as each phase introduces them.

## Theming

Semantic colour tokens (`bg-surface`, `text-muted`, `bg-primary`, `bg-action`, `bg-accent-soft`, …) live in `src/styles/index.css` and switch with `data-theme="dark"` on `<html>`. Brand scales `forest-*`, `leaf-*`, `ochre-*` and `cream-*` are also available.

## Backend status

Supabase authentication, database and Paystack payments are **not connected**. The UI talks to service interfaces, so a real backend can replace the demo adapters later without touching pages. Demo records are always labelled as illustrative.
