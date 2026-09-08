---
name: Agentic career AI fallback
description: The career demo must stay usable even when a live LLM provider is unavailable.
---

Live OpenAI refinement is optional; deterministic, explainable analysis and tool outputs are the required baseline so the internship demonstration never collapses into an empty screen when provider access or billing is unavailable.

**Why:** Managed AI setup required an account upgrade, so the project needed a trustworthy path that still demonstrates Agent + RAG + Memory + Tool Calling.

**How to apply:** Keep provider calls additive, record the active path in the agent trace, and preserve the same response contracts for live and fallback modes.