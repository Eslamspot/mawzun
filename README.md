This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**موزون (Mawzun)** is a **fidelity-of-transmission meter**: it measures whether the Sharia meaning of an original text survives a translation, a summary or a paraphrase. It does not issue fatwas, does not favour a madhhab, and does not rule on the soundness of an opinion.

## Package manager: Bun only

This repository is **Bun-only**. `npm`, `yarn` and `pnpm` are not used or supported here:

- the reference lockfile is [`bun.lock`](./bun.lock) (there is no `package-lock.json`, `yarn.lock` or `pnpm-lock.yaml`);
- `package.json` pins the toolchain with `"packageManager": "bun@1.4.2"`;
- the `preinstall` guard at [`scripts/ensure-bun.mjs`](./scripts/ensure-bun.mjs) refuses to install dependencies when the command comes from `npm`, `yarn` or `pnpm`.

```bash
bun install        # install dependencies
bun add <pkg>      # add a dependency
bun add -d <pkg>   # add a dev dependency
bun remove <pkg>   # remove a dependency
bunx <tool>        # run a one-off tool (instead of npx)
bun run lint       # run a script
```

## Getting Started

Install the dependencies with Bun, then run the development server:

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The whole workflow is a **single page at `/`** with five anchored sections (`#step-1` … `#step-5`); there are no per-stage routes and no sidebar.

The audit engine lives in `src/lib/audit/` and runs the three check layers in order, then a fixed verdict rule, and seals the run into a reproducible SHA-256 record.

### Other scripts

```bash
bun run build        # production build
bun run start        # serve the production build
bun run lint         # ESLint over the codebase
bun run docs:check   # documentation integrity: front-matter, ordering, internal links
bun run engine:check # behavioural assertions over the audit engine
```

## Project layout

- `src/app/` — App Router: `layout.tsx`, `page.tsx` (the single-page workspace), `globals.css` (design tokens), and `api/audit/route.ts` (`POST /api/audit`)
- `src/components/audit/` — `AuditWorkspace`, the five section components, and the shared primitives (`parts.tsx`)
- `src/components/layout/` — `AppShell`, `TopBar`, `SearchModal`, `SettingsModal`
- `src/components/ui/` — `Icon` (the remaining neutral UI primitive)
- `src/context/` — `AuditContext` (run state + sealed record) and `ToastContext`
- `src/lib/audit/` — the engine: constraint bank, ruling-force table, layers 1–3, verdict, sealed record, Arabic normalizer
- `src/lib/` — `stages.ts` (the five sections), `typography.ts`, `cx.ts`
- `stitch_mawzun/` — original design references
- `archive/` — pre-change file snapshots, kept per the project rules
- `AGENTS.md` — mandatory project rules (Bun-only, tags/archive, branch policy)

## Documentation

The full documentation lives in [`docs/`](./docs) and is read on GitHub (there is no in-app
documentation centre; the `/docs` route was removed with the stage routes). Start from
[`docs/README.md`](./docs/README.md) for the complete map of the docs.

- `docs/getting-started/` — installation, project structure and scripts
- `docs/architecture/` — overview, routing & sections, design system, components, docs engine
- `docs/workflow/` — fidelity audit, the audit pipeline and the semantic-guard principle
- `docs/reference/` — code conventions and the bilingual glossary
- `docs/adr/` — architecture decision records

Validate the docs with `bun run docs:check` (front-matter, ordering and internal links).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Vercel detects Bun through the `packageManager` field and the committed `bun.lock`, so builds run on Bun there as well.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
