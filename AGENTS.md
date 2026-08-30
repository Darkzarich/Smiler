# AGENTS.md

## Project overview

pnpm monorepo — a Reddit-style social platform (MEVN stack).
Two packages: `packages/backend` (Express 5 + TypeScript + MongoDB/Mongoose + sessions) and `packages/frontend` (Vue 3 + Vite + Pinia).

## Common commands

```bash
pnpm install                # install all workspace deps
pnpm dev                    # runs backend + frontend concurrently
pnpm build                  # builds backend, then frontend

# Linting (run all three before committing)
pnpm lint:spell             # cspell spellcheck (root)
pnpm lint:code              # eslint on backend + eslint+stylelint on frontend
pnpm lint:types             # tsc --noEmit on both packages

# Testing
pnpm test                   # backend jest + frontend playwright e2e
pnpm test:prepush           # backend jest + frontend vitest unit
```

Pre-push hook runs: `lint:spell → lint:code → lint:types → test:prepush`.

## Backend (`packages/backend`)

- **Entry**: `index.ts` (cluster mode) → `src/app.ts`
- **Dev server**: `pnpm --filter backend dev` (ts-node)
- **Build**: `tsc && tsc-alias` — output goes to `dist/`
- **Tests**: Jest integration tests using `mongodb-memory-server` (no external DB needed). Requires `NODE_OPTIONS="--experimental-vm-modules"`.
  - Test files: `tests/**/*.spec.ts`
  - Global setup spins up an in-memory MongoDB on port 27018; sets `DB_URL` automatically.
  - Run single test: `pnpm --filter backend test -- tests/integration/some-file.spec.ts`
- **Path aliases** (tsconfig + ts-node): `@config/*`, `@routes/*`, `@controllers/*`, `@middlewares/*`, `@libs/*`, `@models/*`, `@utils/*`, `@validators/*`, `@constants/*`, `@type/*`, `@errors`, `@test-utils/*`, `@test-data-generators`
- `.env` file required at repo root (copy from `.env.example`). Backend reads it via dotenv.
- Swagger docs at `/api-docs/` when running.

## Frontend (`packages/frontend`)

- **Dev server**: `pnpm --filter frontend dev` (Vite, port 8080)
- **Build**: `vite build`
- **Unit tests**: Vitest with jsdom — files matching `src/**/*.spec.ts` or `src/**/*.test.ts`
  - Run single: `pnpm --filter frontend test:unit:ci -- src/path/to/test.spec.ts`
- **E2E tests**: Playwright against the built app (`vite preview` on port 4173). Files in `tests/integration/`.
  - Run: `pnpm --filter frontend test:e2e:ci`
- **Path aliases**: `@/*`, `@components/*`, `@common/*`, `@icons/*`, `@utils/*`
- **Linting**: separate ESLint (`.js/.ts/.vue`) and Stylelint (`.css/.scss/.vue`) passes
- Vue component style: PascalCase component names in templates; blank lines between `<template>`/`<script>`/`<style>` blocks.
- `vuedraggable@4.1.0` is patched — see `patches/` directory.

## Commit style

Format: `<scope> <imperative-verb> <short description>` — lowercase, no trailing period, no conventional-commits prefixes.
Scope is the package name (`backend` / `frontend`) when changes are scoped to one package; omitted for repo-wide changes.

Examples:

```
backend enforce unique email and login constraints with separate indexes and normalization
frontend fix tiptap formatting toolbar after click starts d&d for the section
add git hooks with husky and lint-staged
align eslint and prettier versions across packages
```

## Project timeline

`README.md` has a **Project Timeline** section (a collapsed `<details>` block) listing the project's milestones by month.

Any **major** change must be added there as part of the change itself: stack or framework migrations, major dependency majors (Node, MongoDB, Vue, Express, Mongoose), new features users can see, large refactors, security hardening pushes, new tooling (test runners, linters, build tools), and infrastructure moves.

Do **not** add: routine dependency bumps, bug fixes, small style tweaks, or single-endpoint changes.

How to add one:

- Append to the newest year heading (add a new `### <year> — <theme>` heading if the year isn't there yet).
- Use the existing bullet format: `- **<Mon Year>** — <what changed and why it mattered>`, with key technologies in bold.
- If a month already has a bullet on a different theme, give both a theme label instead of repeating the bare month: `- **<Mon Year> — <theme>** — ...`.
- If a bullet for that month already exists and the change belongs with it, extend that bullet instead of adding a near-duplicate.
- Link the first mention of a named library or tool to its GitHub repository, e.g. `**[Vitest](https://github.com/vitest-dev/vitest)**`. Link it once per timeline, not on every repeat. Databases, platforms, and specs (MongoDB, Docker, OpenAPI) are not linked.

## Gotchas

- **Node version**: >=v24.0.0. `.nvmrc` says `v24.20.0`.
- **pnpm version**: >=8.6.0.
- Backend uses `module: "NodeNext"` / `moduleResolution: "nodenext"` — use proper file extensions in imports where required.
- Backend Jest config uses `module.exports` in a `.ts` file — this is intentional. It also carries a
  `@jest-config-loader ts-node` docblock: without it, Node's native type stripping makes Jest load
  `jest.config.ts` as ESM, which rejects both the `tsconfig.json` import and `module.exports`.
- Frontend `tsconfig.json` has `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- `packages/backend/logs/` and `packages/backend/uploads/` are generated at runtime, gitignored.
- `cspell.json` has a project-specific dictionary — add project terms there, don't disable spellcheck.
