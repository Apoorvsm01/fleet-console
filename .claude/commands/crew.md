---
description: Run the design-crew pipeline from a given stage (e.g. /crew 1, /crew 3, /crew 5)
argument-hint: <stage number>
---

Orchestrate the design-crew pipeline described in `pipeline/README.md`, starting at stage $ARGUMENTS.

- Run each stage by spawning its agent (`.claude/agents/<name>.md`). Never do a stage's work in the main thread.
- Pass agents file paths, not summaries.
- Stop at 🚦 gates (after stage 2 and after stage 5). Summarize the output for the human in under 200 words and wait.
- Stage 4: spawn one `builder` per screen in parallel. Then capture a screenshot of each screen into `pipeline/screens/` and run stage 5a and 5b in parallel. Loop builders on critiques at most 2 times before Gate 2.
- After each agent finishes, append a row to `pipeline/metrics.md`: date | stage | agent | model | tokens | tool calls | seconds.
