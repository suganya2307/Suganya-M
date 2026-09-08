# AI Resume & Career Assistant

An agentic career studio that analyzes student resumes, remembers career context, grounds answers in indexed resources, and generates practical resume, skill, and interview outputs.

## Run & Operate

- `cd ../.. && python -m python_app.app` from `artifacts/api-server` — run the Python API service on port 8080
- `python -m compileall -q python_app main.py` — validate Python syntax
- `pnpm --filter @workspace/career-assistant run typecheck` — validate the retained React presentation layer
- Required env: `DATABASE_URL` — PostgreSQL connection string
- Optional env: `OPENAI_API_KEY` — live structured refinement; deterministic agent fallbacks remain available without it

## Stack

- Python 3.11, FastAPI, Uvicorn
- API: Python package in `python_app/`
- DB: PostgreSQL via psycopg, with a local SQLite fallback only when `DATABASE_URL` is absent
- Document extraction: pypdf and python-docx
- Presentation: retained React/Vite UI, calling the Python API contract

## Where things live

- `main.py` — Python service entry point.
- `python_app/` — FastAPI application, agent helpers, retrieval, memory store, tools, extraction utilities, and local data directories.
- `artifacts/career-assistant/src/App.tsx` — responsive career studio UI, student flows, and recruiter workspace.
- `artifacts/career-assistant/src/index.css` — visual system and responsive theme.
- `artifacts/api-server/.replit-artifact/artifact.toml` — managed Python API workflow.
- `requirements.txt` — Python runtime dependencies.

## Architecture decisions

- The app keeps the existing React presentation layer, but all application logic and persistence now run through the Python FastAPI service.
- RAG is upload-driven: text, JSON, CSV, PDF, and DOCX content is extracted, chunked, scored against the question, and returned with sources plus an agent trace.
- OpenAI is optional at runtime. When `OPENAI_API_KEY` is present, the Python agent asks `gpt-5.4-mini` for structured refinements; otherwise transparent deterministic fallbacks keep the demonstration functional.
- PostgreSQL retains the existing career tables and adds candidate, job, and recruitment-interaction memory tables without requiring the old Node/Drizzle API server.

## Product

- Overview dashboard with resume health, skill coverage, role fit, interview readiness, memory, resources, and activity.
- Resume lab with sample resume, text-file upload, analysis, missing skills, role recommendations, and improved resume tool output.
- Recruiting desk with candidate extraction, job analysis, explainable matching, candidate ranking, interview prompts, recruitment FAQ, and PDF/DOCX upload support.
- Career path with skill gaps and a personalized 30/60/90 day plan.
- Interview room with role/difficulty-aware questions and coaching.
- Knowledge base with resource indexing, grounded Q&A, citations, and trace.
- Profile memory editor for skills, interests, goals, education, and target roles.

## User preferences

- The requested product should be suitable for an IBM Agentic AI internship final-project demonstration.

## Gotchas

- Restart the managed API workflow after Python backend changes so the process reloads.
- The existing React app still uses the workspace’s generated career client for compatibility; the Python API preserves those response shapes.
- The recruiter upload path sends binary PDF/DOCX files to Python for server-side extraction; the older student resume/resource screens still read browser files as text.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
