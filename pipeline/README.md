# Design-crew pipeline

A file-passing agent pipeline that takes a product brief to a working, critiqued desktop prototype.
Agents never share chat history: each stage reads a few small files in `pipeline/` and writes one.
Cheap models do the volume; the human (and Opus) decide only at gates.

```
brief.md ─► domain-modeler ─► object-model.md ─► ia-architect ─► ia.md
                                                                   │
                                                             🚦 GATE 1 (human)
                                                                   │
                       tokens.json + components.md ◄─ system-designer
                                    │
                       builder ×N (parallel) ─► prototype/
                                    │
              token-linter (haiku) + ux-critic (sonnet) ─► critiques/NN-*.md ─┐
                                    ▲                                          │
                                    └──────────── builders fix ◄───────────────┘
                                                                   │
                                                             🚦 GATE 2 (human)
                                                                   │
                     storyteller ─► case-study.md ─► honesty-checker ─► flags.md
```

| Stage | Agent | Model | Reads | Writes |
|---|---|---|---|---|
| 0 | (human + Opus) | opus | interviews, ground truth | `brief.md` |
| 1 | `domain-modeler` | sonnet | brief | `object-model.md` |
| 2 | `ia-architect` | sonnet | brief, object-model | `ia.md` |
| 3 | `system-designer` | sonnet | brief, ia | `tokens.json`, `components.md` |
| 4 | `builder` | sonnet | tokens, components, ia (one screen) | `prototype/…` |
| 5a | `token-linter` | haiku | prototype, tokens | `critiques/NN-lint.md` |
| 5b | `ux-critic` | sonnet | screenshots, ia, brief | `critiques/NN-ux.md` |
| 6 | `storyteller` | sonnet | brief, decisions | `case-study.md` |
| 7 | `honesty-checker` | haiku | brief, case-study | `flags.md` |

## Shared rules (every agent)

1. **`brief.md` is ground truth.** Never contradict it; never invent users, quotes, metrics, or outcomes.
2. **Append to `decisions.md`** for every non-trivial choice, using the format at the top of that file:
   what was decided, the alternatives rejected, and why. The decision log is the case study's raw material.
   Number entries `D-NEW`. The orchestrator assigns real numbers after each stage, because parallel agents
   picked colliding numbers in the first run.
3. **Stay in your lane.** Write only your own output files (plus your `decisions.md` entries).
4. **NDA re-creation.** Everything is a new design that must not reproduce the real Woven by Toyota product.
   No real vehicle IDs, locations, people, or internal tool names.
5. **Be brief.** Outputs are read by other agents. Prefer tables and lists; no preamble.

## Metrics

`metrics.md` logs tokens, tool calls, and wall time per stage run, which the orchestrator copies from each agent's usage report.
These are the pipeline's real, measurable outcomes.
