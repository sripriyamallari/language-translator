# Language Translation Tool

lingonear is a mobile-friendly translation workspace for short phrases between English, Telugu, Hindi, French, Spanish, and German.

## Run & Operate

- `pnpm --filter @workspace/language-translation-tool run dev` — run the translation tool
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS with custom CSS tokens
- Translation service: MyMemory free translation API
- Browser APIs: Clipboard and SpeechSynthesis

## Where things live

- `artifacts/language-translation-tool/src/App.tsx` — translation state and UI
- `artifacts/language-translation-tool/src/index.css` — responsive visual system
- `artifacts/language-translation-tool/index.html` — SEO and social metadata

## Architecture decisions

- Translation happens client-side through MyMemory so the internship project does not require a server or API key.
- Speech is handled through the browser's native SpeechSynthesis API for zero setup.
- The interface is mobile-first and keeps the source and result in separate, readable panels.

## Product

- Translate short phrases between six supported languages.
- Swap languages, copy results, and read translations aloud.
- Use example phrases to get started quickly.

## User preferences

 - Clean, professional, and suitable for a college internship project.

## Gotchas

- MyMemory is a public free service; network availability and rate limits are outside the app's control.
- SpeechSynthesis voice availability varies by browser and device.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
