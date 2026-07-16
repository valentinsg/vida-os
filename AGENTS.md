<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# vida-os

Valentín's personal life graph. Not a productivity app — a single graph of
every entity in his life (people, projects, pets, debts, habits...) plus an
AI layer that reads and writes it, so one capture like "compré creatina" can
land as connected facts across salud/gimnasio/finanzas without him filing it
by hand in each place.

Full product doc (vision, the 6 objections that shaped this, architecture,
phased roadmap): published as a Claude artifact — ask Valentín for the link
if it's not in conversation context, it isn't checked into this repo.

## Why the data model is two tables, not twenty

`Entity` (typed, JSONB `properties`) + `Relationship` (typed edge between two
entities, JSONB `properties`) is the whole graph. No per-domain tables. Both
`type` fields are **open vocabulary** — plain strings validated in app code,
not Postgres enums — so a new entity or relationship kind never needs a
migration. Valentín himself is an `Entity` of type `person` with
`isSelf: true` in `properties`, not a special-cased "current user" — keeps
every relationship symmetric and walkable both directions.

At life-scale (tens of thousands of nodes, not billions) Postgres with
indexed lookups handles this without the operational cost of running a
dedicated graph database solo for years. `prisma/seed.ts` has real entities
from Valentín's life (Estudio VE, Terry & Gordo, Presidencial...) proving the
model holds actual cross-domain chains — e.g. `Depto --inspired_by-->
Presidencial --inspired_by--> Saints Row 3`. Read it before inventing new
entity/relationship type names; reuse what's there.

## The capture flow (why `Capture` exists)

Natural-language input never writes directly to `Entity`/`Relationship`. The
LLM proposes entities/edges into `Capture.proposedEntities` /
`proposedRelationships`; the user taps to confirm (or edits) before it's
committed. This isn't a placeholder for future autonomy — it's a deliberate
choice: silent auto-linking accumulates unnoticed errors, and a graph you
stop trusting is a graph you stop using. Full autonomy is earned with
history (see roadmap Fase 3), not assumed from day one.

## Prisma 7 specifics (tripped this up once, don't relearn it)

This project's Prisma version requires an **explicit driver adapter** —
`PrismaClient` has no implicit query engine anymore. Always:
```ts
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
```
The generator is configured with a custom output (`generator client` in
`prisma/schema.prisma`), so the client imports from `@/generated/prisma/client`
(or `../src/generated/prisma/client.js` from `prisma/`), never from
`@prisma/client` directly. JSON fields need `as Prisma.InputJsonValue` casts
— plain `Record<string, unknown>` doesn't satisfy Prisma's JSON input type.

`src/lib/db.ts` is the singleton the app should import (`import { db } from
"@/lib/db"`) — don't instantiate `PrismaClient` anywhere else.

## Infra

Self-hosted, cost is the primary constraint (Valentín's explicit call — cheap
over managed/enterprise security guarantees). No production DATABASE_URL is
committed; `.env` stays gitignored. Whatever Postgres this ends up pointed at
(a VPS, a free-tier box, a home server) still gets baseline hygiene — disk
encryption, DB not exposed raw to the internet, backups — because that costs
nothing extra, not because the threat model changed.

## LLM provider

Gemini (`@google/genai`, `gemini-2.5-flash`), not Claude — deliberate: the
Claude Code subscription doesn't include API credits, so the app's own LLM
calls need separate billing, and Gemini's free tier keeps Fase 0 at zero
cost while the capture flow is being validated. Structured output uses
`responseJsonSchema` (not the older `responseSchema` field — SDK migrated
to backend JSON Schema support since v1.9.0). `src/lib/llm.ts` is the only
place that should call the SDK; swapping providers later means changing one
file. Requires `GEMINI_API_KEY` in `.env` (get one free at
aistudio.google.com/apikey) — capture won't work without it, though
everything else (schema, seed, entity list) does.

## Notifications channel

WhatsApp is the target (Valentín's daily ecosystem), not Telegram, despite
Telegram being technically safer. Two-tier plan: CallMeBot for one-way daily
reminders now (free, zero ban risk, but outbound-only — can't receive
replies); `open-wa` (self-hosted, v4 stable — v5 is alpha, don't use it yet)
for bidirectional commands/queries later, with the WhatsApp-number ban risk
knowingly accepted by Valentín rather than avoided.

## Codebase knowledge graph

`graphify` skill is installed specifically for this project — as the
codebase grows, re-run it to keep an indexed graph of the code itself, and
query that instead of re-reading files cold each session. Given the whole
product is "index your life as a graph instead of re-deriving it each time,"
skipping this for the code that builds it would be a little embarrassing.

## Roadmap (see full doc for detail)

Fase 0 (current): schema + tap-to-confirm capture + list/table views, no
integrations, no spatial canvas. Fase 1: 2-3 MCP integrations (Calendar,
GitHub, one financial source) + semantic search. Fase 2: the spatial graph
canvas. Fase 3: remaining integrations + proactive suggestions + earned
autonomy.
