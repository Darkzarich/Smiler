# AGENTS.md

## Project overview

pnpm monorepo — a Reddit-style social platform (MEVN stack).
Two packages: `packages/backend` (Express 5 + TypeScript + MongoDB/Mongoose + sessions) and `packages/frontend` (Vue 3 + Vite + Pinia).

## Common commands

```bash
pnpm install                # install all workspace deps
pnpm dev                    # runs backend + frontend concurrently
pnpm build                  # builds backend, then frontend

# Linting (the pre-commit hook only lints staged files, this is the whole repo)
pnpm lint                   # all three passes below, in order
pnpm lint:spell             # cspell spellcheck (root)
pnpm lint:code              # eslint on backend + eslint+stylelint on frontend
pnpm lint:types             # tsc --noEmit on both packages

# Testing
pnpm test                   # backend jest + frontend playwright e2e + frontend vitest
pnpm test:prepush           # backend jest + frontend vitest unit (what pre-push runs)
```

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
- **Linting**: separate ESLint (`.js/.ts/.vue`) and Stylelint (`.css/.vue`) passes
- **Styles**: plain CSS through PostCSS (`postcss.config.mjs`) — there is no Sass. `postcss-nested` gives Sass-style nesting including `&__element` BEM concatenation, which the CSS spec's own nesting cannot do. Breakpoints are `@custom-media` in `src/styles/media.css`, injected into every file by `@csstools/postcss-global-data`, so a component writes `@media (--phone-only)` with no import. Add a breakpoint there, not inline.
- Vue component style: PascalCase component names in templates; blank lines between `<template>`/`<script>`/`<style>` blocks.
- `vuedraggable@4.1.0` is patched — see `patches/` directory.

## Git hooks

Managed by [husky](https://github.com/typicode/husky) in `.husky/`; every hook delegates to a root `package.json` script:

- **`pre-commit`** → `pnpm precommit` → `lint-staged` (see `lint-staged.config.cjs`): Prettier, ESLint/Stylelint `--fix` and cspell over the _staged_ files, plus a full-package `lint:types` for any package with staged code.
- **`commit-msg`** → `pnpm commitmsg` → `scripts/lint-commit-msg.sh`: `commitlint --edit` against `commitlint.config.cjs`, then cspell over the message text. Git's own comment block and the diff `git commit -v` appends are stripped before spellchecking, so only what the author wrote is checked.
- **`pre-push`** → `pnpm prepush` → `pnpm test:prepush` (backend Jest + frontend Vitest).

The split is deliberate: **linting at commit time, tests at push time**. Commits stay fast and mechanical, while every push carries a green suite. Do **not** move the test suites into `pre-commit` — they take minutes and are memory-heavy, and they would run on every WIP commit. Nor should the repo-wide lint passes go back into `pre-push`: `lint-staged` already covers those files at commit time, so re-running them on push only added waiting. Run `pnpm lint` by hand (or in CI) when a whole-repo sweep is wanted.

`--no-verify` skips the hooks; use it only for local scratch commits that get rewritten before pushing.

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (the Angular convention), enforced by [commitlint](https://github.com/conventional-changelog/commitlint) with `@commitlint/config-conventional` in the `commit-msg` hook.

```
<type>(<scope>)<!>: <description>

[optional body]

[optional footer]
```

- **type** — one of `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. Lowercase.
  - `feat` / `fix` describe user-facing behavior; `refactor` keeps behavior identical; `perf` makes it faster.
  - `build` covers the toolchain and deps, `chore(deps)` a plain dependency bump, `style` formatting-only churn.
- **scope** — optional, and limited to `backend`, `frontend` or `deps` by the `scope-enum` rule in `commitlint.config.cjs`. Omit it entirely for repo-wide changes (tooling, docs, Docker, root config). Add new scopes to that rule, not ad hoc.
- **description** — imperative mood, lowercase, no trailing period. The header (type + scope + description) is capped at 100 characters.
- **spelling** — the whole message goes through cspell with the project dictionary. Add project terms to the `words` list in `cspell.json` instead of rewording around them.
- **breaking changes** — `!` before the colon and/or a `BREAKING CHANGE: <what broke>` footer.
- Body and footers are separated by blank lines and wrapped at 100 characters.

Examples:

```
feat(backend): enforce unique email and login constraints with separate indexes
fix(frontend): keep the tiptap toolbar open when a drag starts on the section
perf(backend): search post titles through a text index instead of a regex scan
refactor(backend): extract a shared post list responder for category, feed and search
build: add commitlint and validate messages in the commit-msg hook
chore(deps): align eslint and prettier versions across packages
docs: document the conventional commit format
```

History before Aug 2026 uses the old `<scope> <imperative verb> <description>` format (`backend fix user login lookup`). It is kept as-is — don't imitate it in new commits.

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
