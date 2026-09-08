# AI Resume & Career Assistant

An agentic career studio that analyzes student resumes, remembers career context, grounds answers in indexed resources, and generates practical resume, skill, and interview outputs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/career-assistant/src/App.tsx` — responsive career studio UI and route-level flows.
- `artifacts/career-assistant/src/index.css` — visual system and responsive theme.
- `lib/api-spec/openapi.yaml` — source of truth for the career API.
- `artifacts/api-server/src/routes/career.ts` — persistence, RAG retrieval, agent orchestration, and career tools.
- `lib/db/src/schema/career.ts` — PostgreSQL tables for profile memory, resources, analyses, and activity.

## Architecture decisions

- The app uses a single demo student workspace today; profile memory and career artifacts persist in PostgreSQL.
- RAG is intentionally explainable: resource text is stored as indexed content, simple lexical retrieval selects relevant sources, and the answer returns its sources plus an agent trace.
- OpenAI is optional at runtime. When `OPENAI_API_KEY` is present, the agent asks `gpt-5.4-mini` for structured refinements; otherwise transparent deterministic fallbacks keep the demonstration functional.
- The browser accepts text-based resume/resource uploads and sends extracted text through the same API used by paste flows.

## Product

- Overview dashboard with resume health, skill coverage, role fit, interview readiness, memory, resources, and activity.
- Resume lab with sample resume, text-file upload, analysis, missing skills, role recommendations, and improved resume tool output.
- Career path with skill gaps and a personalized 30/60/90 day plan.
- Interview room with role/difficulty-aware questions and coaching.
- Knowledge base with resource indexing, grounded Q&A, citations, and trace.
- Profile memory editor for skills, interests, goals, education, and target roles.

## User preferences

- The requested product should be suitable for an IBM Agentic AI internship final-project demonstration.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Restart the managed API workflow after backend changes so the bundled routes update.
- Browser upload is intentionally limited to text-readable formats in this first build; PDF/DOCX extraction is a follow-up.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
