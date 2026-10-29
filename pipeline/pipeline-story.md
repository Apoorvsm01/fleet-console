# Design-crew: the agent pipeline I built to re-create this work

**Scope note:** I built this pipeline afterward, for the portfolio re-creation of the Fleet Console concept. I did not use it at Woven.

I needed an NDA-safe re-creation of a concept, with a new design and a new system. Instead of hand-building it in one long chat, I split the job into stages. Agents never share chat history (by design). Each reads a few small files and writes one.

```
brief.md ─► domain-modeler ─► ia-architect ─► ia.md
                                                │
                                          GATE 1 (human)
                                                │
                    tokens.json + components.md ◄─ system-designer
                                │
                 builder ×N (parallel) ─► prototype/ (desktop)
                                │
          token-linter + ux-critic ─► critiques/ ─► builders fix
                                │
                          GATE 2 (human)
                                │
   system-designer (touch + glance) ─► iOS builder ║ vehicle builder
                                │
                  ux-critic (surfaces) ─► fix builders
                                │
        storyteller ─► case-study.md ─► honesty-checker ─► flags.md
```

## The human gates

- **Stage 0:** I write the brief with Opus. It is ground truth, and no agent may contradict it or invent users, quotes or metrics.
- **Gate 1:** I choose between three IA models and answer open questions. I picked workflow-first. It also marked which agent defaults were assumptions I hadn't confirmed.
- **Gate 2:** I review screenshots, and my critique drove the second fix round.
- **After the surfaces fixes:** the glance numbers and guided-call wording are still the agents' proposals, waiting on me and a safety owner (D-028, D-029).

## Model routing

Cheap models do the volume, and the human decides at gates.

- **Opus plus me:** the brief and gate decisions. Opus tokens aren't logged.
- **Sonnet:** modeling, IA, system design, building, critique, storytelling. 29 of the 34 logged runs.
- **Haiku:** mechanical work: scaffold, contrast check, screenshots, token linting, and the honesty check. 5 runs.

## Real numbers

From `metrics.md`, all rows: 34 logged agent runs on one day, plus the Opus row, which has no numbers. **The totals cover these logged pipeline runs only.** They exclude the review and inventory agents that ran before the pipeline existed.

| | |
|---|---|
| Tokens | 2,430,679 (about 2.43M) |
| Tool calls | 532 |
| Summed agent seconds | 14,438 s, of which 8,108 s is one row (below) |
| Seconds without that row | 6,330 s, about 106 min |
| Sonnet / Haiku share of tokens | about 77% / 23% |

The honesty-checker's 8,108 s is wall time that includes waiting, not work. Parallel runs also overlap, so the summed seconds are not wall-clock.

Per stage:

- Domain model: 70.6k tokens. IA: 22.6k.
- System: 50.7k, 224 s. Surfaces extension: 63.8k, 199 s.
- Foundation builder: 186.9k tokens, 39 tool calls, 940 s. The longest working run.
- Four parallel desktop screen builders: 40k to 64k each.
- Token linter: 232k, the largest single run.
- Desktop UX critic: 83k tokens, 22 tool calls, 105 s.
- Desktop fix rounds: round 1 about 297k, round 2 about 106k, a 55k table-fit pass, a 37k polish pass.
- Surfaces phase (8 runs): about 675k tokens, 170 tool calls. Surfaces critic: 152k, 33 tool calls.
- Storyteller: 80.8k tokens, 20 tool calls. Honesty-checker: 79.9k, 7 tool calls.

## The surfaces phase

The brief splits the work by job (D-008): desktop triages, iPhone reaches the right person, the car captures. So after the desktop round I ran a second, shorter cycle.

1. **System extension.** The system-designer added `theme-surfaces.css`, scoped by `data-surface`. It remaps Plumb's existing scale for touch and glance. I rejected a separate system per surface, because that forks severity and status meaning (D-025).
2. **Two builders in parallel**, one for iOS and one for the car.
3. **A critique** of 36 screenshots, with ranked findings.
4. **Four fix builders:** hand-off, vocabulary, iOS and vehicle.

Everything on these surfaces is a prototype with fixture data. The glance numbers are proposals built on my own in-vehicle standard, not research.

## Five moments that mattered

**1. The contrast script caught what I'd hand-computed.** The system designer's contrast ratios were hand-computed, and I'd flagged them as unverified. A script checked 194 pairs, and 6 failed, all on one token (unfilled status segments, 1.35 to 1.91:1). I raised it to at least 3:1 (D-018). The same run showed two claimed ratios in the tokens file differing from the computed ones by more than 5%. Both were understated.

**2. Parallel builders collided on decision numbers.** Builders picked overlapping IDs in `decisions.md`, and two used the same label. I changed the rule: builders write `D-NEW`, and the orchestrator renumbers entries after each stage. Some `D-NEW` entries are still in the log.

**3. The critique caught clipped columns, and it took three passes.** The UX critic flagged Inbox columns clipped off-screen. They survived the first fix and again at Gate 2, when my review showed the Status header cut to "STA". The real cause, a table that sized flexible tracks to the longest title, was fixed in a dedicated pass.

**4. The critique caught a question with the wrong answer key.** In the car, the guided call step read "Are you safe?" with a single Done key. Done doesn't answer a question. It was finding 1 of 12. The fix gives questions Yes/No keys. "No" shows "Stay put. Help's coming." and doesn't tick the step. The wording is a placeholder for a safety owner.

**5. The 2-second glance rule became a measurement.** The critique estimated type and target sizes from screenshots and told me to verify them in the DOM. It found a few below the 32 px floor, such as the "m" unit on the hazard band. The shoot script now measures the smallest computed font and the smallest target in every vehicle state, and fails below 32 and 76 px. Both floors are my proposals. The script enforces a rule, not a finding about drivers.

I also added a cross-surface hand-off check script. It passes: a tag captured in the car reaches the desktop through the shared in-memory store. That store resets on reload.

## Limits

- **No quality benchmark.** I have no proof that this beats a person working alone. The numbers measure effort, not quality.
- **Tokens aren't cost or calendar time.** The summed seconds overlap, and I did not log my own time.
- **The critic judged static screenshots.** The first full-page captures weren't full-page, so the coverage bar and Resolve button went unseen until later.
- **Contrast checks cover color only.** They say nothing about layout or comprehension. The 32/76 px check covers size only.
- **Many decisions are still OPEN.** These include unbuilt features and token drift between the spec and the prototype. The shared vocabulary reached the desktop but not yet the iPhone and in-car builds (D-034).
- **The agents invent things.** Protocol steps, the severity map and the timeout length are placeholders, and the pipeline can't tell me they're wrong. Only a safety owner can.
