# Redesign spec: "snapshot" case studies

Written by the orchestrator (Opus) from the designer's feedback ("way too much text, doesn't look like a complete case study"). The values come from a portfolio-presentation video the designer chose: open with motion, give a one-line identity, show a personal story, keep case studies as **snapshots** (one big visual plus one headline), and remember that personal stories can't be templatized.

## Rules for every section

1. **Visual first.** Every section leads with an image, video or diagram. No section is text-only, except the honesty line.
2. **One headline per section**, ≤ 10 words, stating the insight, not the topic ("Escalation can never stop at one person", not "Escalation").
3. **≤ 2 short sentences of body** under the headline, ≤ 40 words. Lists only where they ARE the content (≤ 4 items, ≤ 12 words each).
4. **Decisions are cards, not paragraphs.** Each card is a decision title plus "Chose X over Y, because Z" in ≤ 20 words.
5. **Keep every honesty fact**, compressed, never dropped:
   - a self-initiated concept at Woven by Toyota
   - an NDA re-creation with invented data
   - no outcome metrics
   - the outcome is internal
   - the pipeline was built afterward and not used at Woven
6. **Budget:** Fleet Console body ≤ 450 words, Design-crew body ≤ 300 words. Count everything except alt text.
7. **The arc is the arc of a complete case study:** Hook → Context → Problem → Insight → Decisions → Solution (by surface) → System → Proof and limits → What I'd do next. Use the site's chapter nav, with ≤ 8 chapters.
8. Never invent copy, numbers or claims. Compress from `pipeline/case-study.md` and `pipeline/pipeline-story.md`; when in doubt, cut.

## Fleet Console: target outline

| # | Chapter | Visual | Headline (draft; tighten if you can) | Body |
|---|---|---|---|---|
| 0 | Hero | **Motion reel** (`reel.mp4`, ~15 s loop: Now → escalation acknowledged → iPhone takeover → in-vehicle tag) | "Fleet Console" plus the claim | Facts table: role, context, status (concept, NDA re-creation, no metrics), surfaces |
| 1 | The problem | now-light.png, cropped to coverage gap and span | "Test fleets grow faster than their oversight" | 2 sentences: leads can't see oversight debt; escalation hangs on one phone call. Cite "public reporting on AV test programs" |
| 2 | Two users | a 2-up cards visual: operator (in car) and lead (remote) | "One drives. One is the safety net." | 1 sentence each |
| 3 | The insight | the pipeline-free IA diagram: TO MAKE as an SVG, "verbs on top, objects underneath" (Now / Inbox / Owned / Review / Fleet / Plan over Incident) | "Organize around 'what needs me now', not the data" | 1 sentence |
| 4 | Decisions | cards ×6 | "Six calls that shaped it" | cards only |
| 5 | Three surfaces | vehicle-emergency-connected.png, ios-takeover-acked-light.png, inbox-dark-compact.png (one each) | "Each surface gets the job it's best at" | one ≤ 15-word caption per surface |
| 6 | The system | specimen-light.png | "Plumb: color is meaning, never the only signal" | ≤ 2 sentences: no green; shape plus label; density modes |
| 7 | Proof and limits | escalation-acked-light.png | "What's real, what's assumed" | list ≤ 4: hand-off check passes; glance floor is measured; protocol wording and timeout are placeholders; outcome internal (NDA) |
| — | Prototype embed | (existing embed, now with the switcher) | — | — |

## Design-crew: target outline

| # | Chapter | Visual | Headline | Body |
|---|---|---|---|---|
| 0 | Hero | pipeline.svg (contain) | "Design-crew" plus the claim | Facts table: role, built afterward / not used at Woven, tools |
| 1 | How it works | pipeline.svg, wide | "Agents pass files, not chat history" | ≤ 2 sentences |
| 2 | Where I decide | a gate close-up, OR cards ×2 (Gate 1, Gate 2) | "Two gates where only I decide" | cards |
| 3 | Routing | metrics block (34 runs · 2.43M tokens · 29 Sonnet / 5 Haiku · 2 gates) | "Cheap models for volume, people for judgment" | 1 sentence |
| 4 | It caught real bugs | 3 cards with a tiny screenshot each where one exists: Resolve wasn't actually disabled · "Are you safe?" with only a Done key · columns clipped off-screen | "What the critics caught" | cards |
| 5 | Limits | — | "What it can't prove" | list ≤ 3 |

## Visual assets to produce

- `reel.mp4`: record with Playwright (recordVideo) at 1440×900, then ffmpeg to H.264 MP4, muted, about 15 s, under 4 MB, plus a poster frame JPG. Use smooth, real interactions, not jump cuts only.
- `ia.svg`: the "verbs on top, objects underneath" IA diagram, styled like pipeline.svg (same palette, fonts and dark panel).
- A local looping-video block in the portfolio: `{ "type": "loop", "src", "poster", "caption" }` rendered as `<video autoplay muted loop playsinline>`, respecting prefers-reduced-motion (show the poster plus a play button).
