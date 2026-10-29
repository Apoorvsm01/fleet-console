# Fleet Console

A concept re-creation of an oversight tool for automated-vehicle test fleets, across three surfaces: a desktop console, an iPhone app, and an in-vehicle co-pilot. It was built with **Design-crew**, a file-passing agent pipeline with human decision gates.

- **Live prototype:** https://apoorvsm01.github.io/fleet-console/
- **Case study:** https://apoorvsm01.github.io/portfolio/work/fleet-console
- **How the pipeline works:** https://apoorvsm01.github.io/portfolio/work/design-crew

> **What this is.** I proposed this concept at Woven by Toyota and did its UX research, design and prototyping. It is a concept, not a shipped product. Under NDA, everything here is a from-scratch re-creation: a new design system, invented data, and no real names, vehicles, places or internal tools. I built the agent pipeline afterward to re-create the work for my portfolio. It was not used at Woven.

## The idea

AV test programs grow faster than their oversight. Leads can't see their oversight debt (unreviewed footage, untriaged incidents, uncovered shifts) until something goes wrong, and escalation often depends on one person answering one phone. Fleet Console puts that debt and coverage on the first screen, routes escalations through an on-call rota with a timeout, and gates "resolve" on a fixed safety protocol.

| Surface | Home screen | Job |
|---|---|---|
| Desktop (`/now`) | Now | Triage, oversee, and plan coverage |
| iPhone (`/ios`) | Escalations | Acknowledge in one tap, then work the protocol |
| In-vehicle (`/vehicle`) | Tag pad | Capture an issue in one tap, built to a 2-second glance |

## Repo map

```
.claude/agents/     The eight pipeline agents (one file each, with the model pinned in frontmatter)
.claude/commands/   /crew: the orchestrator command
pipeline/           Every artifact the agents passed between them:
  brief.md            Ground truth (stage 0)
  object-model.md     Domain model (stage 1)
  ia.md               Information architecture, with rejected alternatives (stage 2, gate 1)
  tokens.json,        "Plumb", the design system (stage 3)
  theme*.css,
  components.md,
  surfaces.md
  critiques/          Lint, contrast and UX critiques, plus the human gate review
  decisions.md        Every decision: what was decided, what was rejected, and why
  metrics.md          Tokens, tool calls and time for every agent run
  screens/            Screenshots captured by the shoot scripts
prototype/          Vite + React 19 + TypeScript + Tailwind v4
```

## Run it

```bash
cd prototype && npm install && npm run dev
```

- `npm run shoot` captures every desktop screen into `pipeline/screens/`.
- `node scripts/shoot-vehicle.mjs` captures the vehicle screens and fails if any text drops below 32px or any target below 76px.
- `node scripts/check-handoff.mjs` checks that a tag tapped in the car lands in the desktop Inbox.
- Press `?` in the desktop console for the shortcut sheet, and `⌘K` for the command palette.

## Limits

The data lives in memory and resets on reload. Calls, timers and the lock screen are simulated. The protocol wording, the 5-minute timeout and the glance numbers are my working assumptions, and they would need real safety owners to review them.
