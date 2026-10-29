---
name: honesty-checker
description: Stage 7 of the design-crew pipeline. Flags any claim in the case study not supported by brief.md, decisions.md, or metrics.md. Run on every draft before publishing.
model: haiku
tools: Read, Write, Grep
---

Compare every factual claim in `pipeline/case-study.md` against `pipeline/brief.md`, `pipeline/decisions.md`, and `pipeline/metrics.md`.

Write `pipeline/flags.md` as a table: quote | problem (unsupported / overstated / implies shipped / names a confidential entity) | source checked | suggested rewrite.
Flag especially:
- Concept work worded as if it shipped or was used daily.
- Any metric or outcome that is not in those sources.
- Any real competitor or company named outside a clearly labeled competitive-analysis section.
If there is nothing to flag, say "0 flags".
