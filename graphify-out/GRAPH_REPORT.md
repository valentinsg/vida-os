# Graph Report - .  (2026-07-16)

## Corpus Check
- Corpus is ~5,288 words - fits in a single context window. You may not need a graph.

## Summary
- 197 nodes · 243 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 2,892 input · 850 output

## Community Hubs (Navigation)
- UI Views & Components
- Runtime Dependencies
- Dev Tooling & Types
- shadcn Config
- TypeScript Compiler Options
- Capture Flow (API + LLM)
- Package Scripts
- TS Project Files
- Seed Script
- Project Docs (AGENTS/CLAUDE)
- Root Layout
- ESLint Config
- Next Config
- PostCSS Config

## God Nodes (most connected - your core abstractions)
1. `cn()` - 24 edges
2. `compilerOptions` - 16 edges
3. `include` - 7 edges
4. `tailwind` - 6 edges
5. `aliases` - 6 edges
6. `scripts` - 6 edges
7. `proposeCapture()` - 6 edges
8. `Badge()` - 5 edges
9. `Button()` - 4 edges
10. `lib` - 4 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `proposeCapture()`  [EXTRACTED]
  src/app/api/capture/route.ts → src/lib/llm.ts
- `CardDescription()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/card.tsx → src/lib/utils.ts
- `CardAction()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/card.tsx → src/lib/utils.ts
- `CardFooter()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/card.tsx → src/lib/utils.ts
- `TableFooter()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/table.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (16 total, 3 thin omitted)

### Community 0 - "UI Views & Components"
Cohesion: 0.14
Nodes (23): Capture, CaptureForm(), Badge(), badgeVariants, Button(), buttonVariants, Card(), CardAction() (+15 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (29): @base-ui/react, class-variance-authority, clsx, @google/genai, lucide-react, next, dependencies, @base-ui/react (+21 more)

### Community 2 - "Dev Tooling & Types"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 3 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 4 - "TypeScript Compiler Options"
Cohesion: 0.10
Nodes (21): dom, dom.iterable, esnext, ./src/*, compilerOptions, allowJs, esModuleInterop, incremental (+13 more)

### Community 5 - "Capture Flow (API + LLM)"
Cohesion: 0.16
Nodes (13): POST(), adapter, globalForPrisma, ai, CaptureProposal, isTransient(), KNOWN_ENTITY_TYPES, KNOWN_RELATIONSHIP_TYPES (+5 more)

### Community 6 - "Package Scripts"
Cohesion: 0.17
Nodes (11): name, prisma, seed, private, scripts, build, db:seed, dev (+3 more)

### Community 7 - "TS Project Files"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 8 - "Seed Script"
Cohesion: 0.32
Nodes (7): adapter, entity(), ids, main(), prisma, rel(), Slug

### Community 9 - "Project Docs (AGENTS/CLAUDE)"
Cohesion: 0.40
Nodes (4): Capture Flow, Entity, Relationship, vida-os

### Community 10 - "Root Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **95 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Tooling & Types` to `Package Scripts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TypeScript Compiler Options` to `TS Project Files`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Views & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Dev Tooling & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._