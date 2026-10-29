# Stage 7 flags

Checked against: `pipeline/brief.md`, `pipeline/decisions.md`, `pipeline/metrics.md`.
Problem types: unsupported / overstated / implies shipped / names a confidential entity. Where a row is also contradicted by a source, the explanation says so.

Counts: **case-study.md: 23 flags. pipeline-story.md: 14 flags.**

## case-study.md

| quote | problem | source checked | suggested rewrite |
|---|---|---|---|
| "at Woven by Toyota I proposed this concept and owned its UX research, design and prototyping." | overstated: brief says the designer owned UX research on Drive Coach. For this concept the deliverable was material for a separate UX research team, and "Measuring outcomes was not my job." | brief.md §1 (Drive Coach research; fleet concept deliverable) | "at Woven by Toyota I proposed this concept and led its design and prototyping. Its research was handed to a separate UX research team." |
| "which made the calls at human gates and logged every decision" | contradicted: the designer made the gate decisions (Gate 1 picks, approvals, answers). The agents did not make calls at gates. | decisions.md D-010 (gate 1 approvals by designer); pipeline-story.md "Gate 1: I choose between three IA models" | "...which ran the routine stages and logged every decision. I made the calls at the human gates." |
| "The fleet lead (remote safety manager) is the human safety redundancy." | overstated: this is how public reporting on a competitor's program describes the role. It is not a confirmed fact about the role in this concept. | brief.md §2B (reporting is [SOURCE] and "not as claims about any specific company") | "In public reporting on one AV test program, the remote fleet manager is described as the human safety redundancy." |
| "Industry job descriptions for the role also list documenting vehicle condition and coordinating repairs." | overstated: brief cites one paraphrased public test-driver posting, not plural job descriptions. | brief.md §2A | "A public test-driver job posting also lists documenting vehicle condition and coordinating repairs." |
| "They need to flag an issue within a 2-second glance" | overstated: the 2-second glance is the designer's in-vehicle standard (Drive Coach), not a researched operator need. | brief.md §1, §4; decisions.md D-027 (proposal, "not new research") | "Operators need to log an issue in the moment. The concept targets a 2-second glance, a proposed standard." |
| "The object model has 15 objects." | unsupported: no object-model.md was in the checked sources, so the count cannot be verified here. | brief.md, decisions.md, metrics.md (none mention a count) | Verify against object-model.md, or remove the count. |
| "so when someone doesn't answer, there is always a next person" | overstated / contradicted: the ios-builder notes ESC-0206 where the user is "last on the chain (no backup to name)". The chain can end. | decisions.md D-031 (ESC-0206 note); D-030 (reroute target) | "so when someone doesn't answer, the escalation re-routes to the next person on the rota. If the chain is exhausted, it shows no backup." |
| "The Woven HMI system is tuned for 2-second glances" | names a confidential entity: an internal company system named outside a competitive note. | brief.md §6 (do not copy the Woven HMI system); decisions.md D-001 | "An in-house in-vehicle HMI system is tuned for 2-second glances." |
| "It's the standard I worked to on Drive Coach's in-car coach." | names a confidential entity: internal product named. Brief allows Drive Coach as context only. | brief.md §1 | "It's the standard I worked to on my in-car coaching work." |
| "I proposed it to my team at Woven by Toyota" | names a confidential entity: real employer named. The rule is to flag any real company outside a competitive note; confirm whether the portfolio may name the employer. | brief.md §1 | "I proposed it to my team at my employer." (or keep, if the employer name is cleared) |
| "The first draft let `a` mean three different things across screens" | overstated: decisions.md D-023 records a conflict between two meanings (assign and acknowledge). "Three" is not in the sources. | decisions.md D-023 | "The first draft let `a` mean both assign and acknowledge, so I made the verbs unique." |
| "so every column fits at 1440" | unsupported: no 1440 width check is recorded. The layout note is a 1280px minimum. | decisions.md D-017 (min width 1280), D-NEW-R2B-2 (440px preview cap) | "so every column fits in the desktop pane at the layout minimum (1280px)." |
| "because critique found the same state called four different things." | unsupported: decisions.md D-034 records the glossary but not a count of names. | decisions.md D-034 | "because the same state had drifted across screens." |
| "fixes one word per concept (Paged → Timed out → Re-routed → Acknowledged → Handled) across all three surfaces" | implies shipped: D-034 says applied to src/components and src/screens; "src/surfaces not yet adopted." | decisions.md D-034 | "fixes one word per concept on the desktop console. The iPhone and in-car builds have not adopted it yet." |
| "Six principles, including \"never trust a single channel\" and \"absence must be drawn\"" | unsupported: only "never trust a single channel" appears in the sources; the count and the second principle do not. | decisions.md D-018 (principle cited) | Verify the principle list against the design-system spec, or cut the count and quote only the verified principle. |
| "acknowledging is one tap from the lock screen" | implies shipped: the lock screen is a static mock. Acknowledge is a one-tap hero-card action in the prototype. | decisions.md D-031 ("Lock-screen mock"), D-NEW-2 (hero card primary is Acknowledge) | "In the prototype, acknowledging is one tap on the escalation hero card. The lock screen is a mock." |
| "The surfaces hand off for real." | implies shipped / overstated: the surfaces share an in-memory store. Ticks do not persist across reload, and the handoff is verified by a check script only. | decisions.md D-023 (ticks per session), D-031, D-032 (check-handoff PASS) | "In the prototype, the surfaces share one in-memory store. A tag captured in the car lands in the desktop Inbox, and a check script verifies it." |
| "Glanceable in under 2 seconds" (image caption) | overstated: no test was run. The glance numbers are proposals, labeled ASSUMPTION in D-027 and D-029. | decisions.md D-027, D-029 | "Built to the 2-second glance standard (proposed, not tested)." |
| "In-vehicle SEV1 call" (image caption) | implies shipped: the call connect and timer are simulated (4 s), and there is no real call. | decisions.md D-030 (OPEN: call connect and timer simulated), D-031 ("Call is a toast, no real call") | "Simulated SEV1 call in the prototype." |
| "Text is 32px or larger, and targets are 96px or larger." | contradicted and assumption stated as fact: D-027 sets a 76px minimum target; 96px applies only to secondary keys. The 32px floor is an ASSUMPTION. | decisions.md D-027 (type floor 32, min target 76, ASSUMPTION), D-NEW vehicle fix round (secondary targets 96px) | "Text is 32px or larger and primary targets are 76px or larger (proposed floors, not research). Secondary keys are 96px." |
| "fails the build if either drops below the floor" | overstated: the decision log says the script "fails below 32/76". It does not mention a build hook. | decisions.md D-NEW vehicle fix round ("Shoot script measures min computed font and min target per state and fails below 32/76") | "The screenshot script measures the smallest font and target in every state and fails if either drops below the floor." |
| "The reporting suggests these fail first, and a log-and-map dashboard hides both." | unsupported: the reporting describes failure modes (as allegations). It does not rank which fails first, and the dashboard claim is not in the sources. | brief.md §2B (allegations, "not as claims") | "The public reporting describes these failure modes as allegations. I think a log-and-map dashboard would hide both; this is untested." |

## pipeline-story.md

| quote | problem | source checked | suggested rewrite |
|---|---|---|---|
| "across 23 logged agent runs on one day" | stale: metrics.md now has 33 logged runs (34 rows, one Opus row with no numbers). The 23 matches only the rounds-1-to-2 subset (rows through 4-fix2b). | metrics.md (all 34 rows) | "across 33 logged agent runs on one day (through round 4-polish and the surfaces fixes)." Or keep "23" and label it "through round 2" in the same sentence. |
| "about 1.56M" (Tokens) | stale for the full log. Full sum is 2,350,764 (about 2.35M). 1,558,023 is correct for the rounds-1-to-2 subset only. | metrics.md, column "tokens" (33 logged rows) | "about 2.35M (1.56M through round 2)." |
| "325" (Tool calls) | stale for the full log. Full sum is 525. 325 is the rounds-1-to-2 subset. | metrics.md, column "tool calls" | "525 (325 through round 2)." |
| "about 57 min" (Summed agent time) | stale for the full log. Full sum is 6,330 s, about 105.5 min (about 106 min). 57 min (3,435 s) is the rounds-1-to-2 subset. | metrics.md, column "seconds" | "about 106 min (6,330 s; 57 min through round 2)." |
| "about 69% / 31%" (Sonnet / Haiku share of tokens) | stale for the full log. Haiku is 486,313 of 2,350,764 (about 21%); Sonnet is about 79%. | metrics.md, "tokens" by model | "about 79% / 21%." |
| "19 of the 23 logged runs." | stale: full log has 29 Sonnet and 4 Haiku runs out of 33 logged. | metrics.md, "model" column | "29 of the 33 logged runs." |
| "Stages 6 and 7 aren't in the metrics yet." | contradicted: a stage 6 row exists (storyteller d1, sonnet, 80,772 tokens, 20 tool calls, 112 s). Stage 7 is not yet logged. | metrics.md (stage 6 row) | "Stage 6 is logged (storyteller, 80,772 tokens). Stage 7 (honesty-checker) is not yet logged." |
| "The same script found two stale claims in the tokens file." | unsupported: decisions.md D-018 records only the 6-of-194 contrast failures. Stale claims are not mentioned. | decisions.md D-018, D-016 | Cite the D-016 entry, or remove the sentence. |
| "I changed the rule: builders write `D-NEW`, and the orchestrator assigns real numbers after each stage. That is why the log has `D-NEW-1` entries." | contradicted: the log still has unassigned D-NEW entries, including three different "D-NEW-1" entries (escalation, inbox, iOS fix round) and two "D-NEW-2" entries. | decisions.md (D-NEW-1 and D-NEW-2 entries; no assignment step recorded) | "I changed the rule so builders write `D-NEW`. The orchestrator assigns real numbers after each stage. The log still has unassigned D-NEW entries that will need renumbering." |
| "The first full-page captures weren't full-page, so the coverage bar and Resolve button went unseen until later." and "The critic judged static screenshots." | unsupported: neither is in the sources. | decisions.md (no mention of capture size or the coverage bar going unseen) | Remove, or cite the screenshot-stage record if one exists. |
| "when my review showed the Status header cut to \"STA\"" | unsupported detail: the "STA" truncation is not in the sources. | decisions.md D-NEW (Inbox, gate 2 #1: status column) | "when my review showed the Status column clipped." |
| "Agents never share chat history." | unsupported: process claim not in the sources. | brief.md, decisions.md, metrics.md | Cite the pipeline spec, or mark as the design intent. |
| "I write the brief with Opus." (and "Opus", "Sonnet", "Haiku" elsewhere) | names real products (AI model names). Not a competitor, so low severity; it is tool disclosure. | metrics.md (model column) | Keep if tool disclosure is intended; otherwise "I write the brief with a large model." |
| "I did not use it at Woven." | names a real company (employer). The statement itself is accurate and implies no Woven use. Flagged only for the company-name rule. | brief.md §1 | "I did not use it at my employer." |

## Notes (not claim flags)

- case-study.md still has placeholders: `[Design-crew](#)`, and `[ASK DESIGNER: ...]` under "What happened next". Brief §7 Q2 and Q3 are unanswered, so that section must not state an outcome.
- pipeline-story.md's round-2 subset numbers (1.56M, 325, 57 min, 69/31, 19 of 23) are correct for their stated scope. The stale part is the scope and the stage-6/7 sentence.
- pipeline-story.md does not mention the surfaces work (stages 3b, 4s, 4s-fix, 5b), which is 14 of the 34 rows and about 0.8M tokens.

## Recomputed metrics totals (metrics.md, all rows)

- Rows: 34 (33 logged runs plus 1 Opus row with no numbers). Haiku runs: 4. Sonnet runs: 29.
- Tokens: 2,350,764 (round-2 subset: 1,558,023).
- Tool calls: 525 (round-2 subset: 325).
- Seconds: 6,330 s, about 105.5 min (round-2 subset: 3,435 s).
- Haiku share of tokens: 486,313 / 2,350,764, about 21%. Sonnet about 79%.
