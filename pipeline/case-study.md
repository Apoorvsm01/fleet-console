# Fleet Console: making AV test-fleet oversight visible before it fails

**Claim:** In AV test programs, oversight fails quietly. I designed a concept console that puts coverage gaps, open incidents and unreviewed footage on the first screen, and makes escalation independent of any one person.

**TL;DR**
- **Role:** at Woven by Toyota I proposed this concept and did its UX research, design and prototyping. A separate UX research team then used the material I produced.
- **Status:** a concept. Nothing here shipped, and no outcome metrics exist.
- **This re-creation:** rebuilt from scratch under NDA as a working three-surface prototype (desktop, iPhone, in-vehicle). I directed it through an agent pipeline I built. Agents drafted and built, I made every call at the human gates, and every decision is logged. See [Design-crew](/work/design-crew) for how.
- **Key idea:** organize the tool around the lead's urgent questions (what needs me, who is uncovered), not around the data objects.

[IMG: escalation-acked-light.png — Escalation takeover, re-created: chain, backup countdown, rota, and a protocol half done]

## What this is, in plain words

- A self-initiated concept. I proposed it to my team at Woven by Toyota after hearing a need from another team.
- My deliverable fed a separate UX research team. Measuring outcomes was not my job.
- The screens are an NDA-safe re-creation, built on a new design system (Plumb) so they differ from the real product. All data is invented sample data.
- No outcome metrics exist for this concept, and I don't claim any.

## 1. The problem

Test programs grow faster than oversight. There are two users.

**Test-fleet operators** drive prototype vehicles. They need to flag an issue without taking their eyes off the road for more than a glance, then triage it later with data. A public test-driver job description also lists documenting vehicle condition and coordinating repairs.

**The fleet lead** (remote safety manager) acts as the human safety redundancy. They follow up every incident, audit footage, and answer operators' emergency calls.

Public reporting on AV test programs describes failures that look structural, not personal. These are allegations, not findings, and I used them only as design pressure:

- **Span of control.** One lead covering far more operators than a stated baseline, across three 24/7 shifts.
- **Single-person escalation.** A night collision call reaches one exhausted lead, with nobody behind them.
- **Oversight debt.** Footage audits and incident follow-ups silently don't happen.
- **Invisible workload.** Overload gets reported by email and shows up only after an incident.

The design job: make capture effortless, make triage fast, make escalation never depend on one person, and make the load visible before it becomes a safety problem.

## 2. How I narrowed it

I asked questions that each ruled something out.

- **Who is the user?** Both operators and leads. An operator-only tool leaves escalation and workload invisible.
- **What is the object everything hangs off?** The incident. A tag is separate and pre-triage: capture must be fast, and treating every tag as an incident floods the lead.
- **What decides who can be reached?** The on-call rota, not a single named lead. Escalation follows the rota for the current shift, so when someone doesn't answer, the page moves to the next person, and the screen says plainly when nobody is left to page.
- **What has no home?** Oversight debt. It spans footage, incidents, escalations and shifts, so it needed a place to live.

The object model has 15 objects. Incident links many-to-many to drives and vehicles, and is reachable from five parents with one canonical page. I defined one 3-level severity scale and one 5-state lifecycle (Captured, Triaged, Owned, Resolved, Verified). Escalated, Overdue and Stale are flags, not states.

Some answers I knew from the work itself: the need came from both operators and leads, the second responder is an on-call rota, and footage is audited for every incident. Others are labeled working assumptions in this re-creation, not facts: span counted per shift, operators triage their own tags, technicians are report-only, and iOS is lead-first.

## 3. Key decisions

**1. Workflow-first IA.**
- *Decided:* nav is verbs and queues: Now, Inbox, Owned, Review, Fleet, Plan. Objects sit one hop below.
- *Rejected:* object-first (a lead opens four lists to find work, and debt has no home); time-first (old open incidents scroll away, recreating the silent backlog).
- *Why:* the three hardest jobs are "act now" or "see now". The cost is that browsing by vehicle is one level down. The palette and Fleet cover it.

**2. Now is home, and it owns debt and coverage.**
- *Decided:* the landing screen shows live escalations, a 24-hour coverage bar with gaps hatched and labeled in text, and four debt tiles. Each tile links to the exact queue behind its number.
- *Rejected:* Inbox as home (a coverage gap stays hidden until someone looks); a weekly report page (too late).
- *Rejected within Now:* a composite score or donut the lead can't reproduce by counting. The hero is a sum with the arithmetic shown, and the number reconciles with its queue.

**3. An escalation rota with a timeout.**
- *Decided:* an unacknowledged escalation re-routes down an on-call rota. The countdown and "who is next" are always visible.
- *Rejected:* a fixed on-call field, which is the single point of failure.
- *Why:* the 2 a.m. failure mode. The 5-minute timeout per link is a placeholder assumption.

**4. Protocol-gated resolve.**
- *Decided:* a fixed 5-step post-incident protocol, with every step always shown and none skippable. Resolve stays disabled until the lead has acknowledged and ticked every step.
- *Rejected:* "not applicable" toggles, which put judgment calls back on a tired lead at 2 a.m.
- *Note:* the step wording is invented and needs review by real safety owners.

**5. One severity scale, and no green.**
- *Decided:* SEV1 is a solid triangle, SEV2 a tinted diamond, SEV3 a hollow ring, each with a label. Red is for SEV1 and coverage gaps only. Healthy and Verified are neutral checks, not green.
- *Rejected:* a second damage/data-health scale (the flaw in my first version); color-only dots; green for success, which adds a third hue family and a red-green pair.
- *Why:* hue never carries meaning alone, so the levels survive grayscale.

**6. The preview-width tradeoff.**
- *Decided:* in Inbox, the Vehicle column was dropped (it stays searchable and shows in the preview), Title is the only flexible column, and the preview is capped at 440px so every column fits at 1440.
- *Rejected:* horizontal scroll, and letting titles and IDs truncate.
- *Why:* critique caught the Status, Owner and Age columns clipped off-screen. Those are the triage signals.

## 4. The system: Plumb

I built an original system rather than reuse an existing one. The Woven HMI system is tuned for 2-second glances, and a borrowed enterprise system would hide my own craft decisions.

- Cool greys, one ink-blue accent, Geist with tabular numerals, borders before shadows.
- Two density modes (36px or 28px rows), and light and dark themes.
- 12 components. Coverage bar and escalation card are system primitives, not one-offs, because they carry the core idea.
- Six principles, including "never trust a single channel" and "absence must be drawn": an uncovered shift, empty queue or stale item has an explicit state.
- A script checked 194 foreground/background pairs for WCAG contrast. Six failed, all on the unfilled status-segment token. I raised it to at least 3:1 because those segments show where an item sits in its lifecycle.
- The vocabulary is part of the system. A shared glossary fixes one word per concept (Paged → Timed out → Re-routed → Acknowledged → Handled) across all three surfaces, because critique found the same state called four different things.

[IMG: TO CREATE: a clean Plumb specimen sheet (severity marks in color and grayscale, status bar, flags, density modes). Do not use gallery-light.png]

## 5. The screens

[IMG: now-light.png — Now: the re-routed escalation, coverage with gaps drawn, span of control against the 15:1 baseline]

[IMG: inbox-dark-compact.png — Inbox, dark and compact: grouped by severity, proposed SEV? on raw tags, keyboard hints inline]

[IMG: incident-sev1-light.png — Incident page: the canonical hub every surface links to]

[IMG: escalation-rerouted-light.png — Timed out and re-routed to the backup, with the full chain visible]

## 6. Beginner to power user

The target is a tool a new user can follow top to bottom and an expert can run without the mouse, replacing spreadsheets.

- **Beginners:** default queues, plain verbs on buttons, and an empty queue that reads as success.
- **Keyboard:** one key map defines every shortcut, and `?` shows it. Examples: `a` acknowledge, `m` assign to me, `e` escalate, `1/2/3` severity, `n` advance status, `t` triage, `d` dismiss, `z` undo. The first draft let `a` mean three different things across screens, so I made the verbs unique.
- **Saved views and the palette:** filter, sort and scope are shareable by URL, and views pin under the nav. Cmd-K jumps to any object or runs actions on the selection. Bulk actions offer undo where the store can reverse them.
- **Not built:** counts on pinned views and the 1-9 jump keys.

## 7. Across surfaces: one system, three jobs

The concept proposed three surfaces. The rule I held them to: each surface gets the jobs it is best at, and none is a shrunken copy of another. They share one data model, one severity scale and one vocabulary, but each home screen is different.

| Surface | Who, where | Its job | Home screen |
|---|---|---|---|
| In-vehicle co-pilot | Operator, driving | Capture in one tap, and get guided through an emergency | Tag pad |
| iPhone | Lead, away from a desk | Be reachable, acknowledge in one tap, work the protocol | Escalations |
| Desktop console | Lead and operators, at a desk | Triage, oversee, plan coverage | Now |

**In the vehicle, the rule is the 2-second glance.** It's the standard I worked to on Drive Coach's in-car coach.
- No lists and no scrolling. Text never drops below 32px and targets never below 76px; most primary keys are 96px or larger.
- Severity is carried by shape and position. A SEV1 takes the whole screen; lower severities use a top band.
- I made the rule testable. The screenshot script measures the smallest rendered text and tap target in every state and fails the check if either drops below the floor.
- Critique caught a guided emergency step that asked *"Are you safe?"* but only offered **Done**. A question needs answers, so questions now get Yes/No keys, and "No" on safety routes to a stay-put help state.

**On iPhone, acknowledging is one tap from the lock screen.** A SEV1 arrives as a critical alert (mocked here; assumed granted). The takeover shows the same 5-step protocol as desktop, and Resolve shows "3 steps left" until it's done.

**The surfaces hand off through one shared store, in the prototype.** A tag tapped in the car lands in the desktop Inbox as *Captured* with a proposed severity, and a check script verifies it. A protocol step ticked on the phone shows as ticked on desktop. The in-vehicle flow logs steps 1–4 and deliberately leaves step 5, "tell the next responder", to the lead, because that step is the lead's job.

[IMG: vehicle-emergency-connected.png — In-vehicle SEV1 call (simulated): one question, two answers, the lead's first name and the timer. Designed to the 2-second glance standard]

[IMG: vehicle-drive-night.png — Tag pad: five keys, most severe nearest the driver (left-hand drive assumed)]

[IMG: ios-takeover-acked-light.png — iPhone takeover after acknowledgement: protocol 2 of 5, Resolve locked]

*Labeled assumptions for these surfaces:* left-hand drive, the tag pad staying 1-tap at any speed, critical alerts granted, and the glance numbers as proposals built on my Drive Coach standard, not new research.

## What happened next

I handed the concept and my material to the UX research team. What happened after that is internal, and I can't share it. Everything on this page is the re-created concept, not its outcome.

## Reflection

- **What I'd defend:** making escalation and debt first-class objects. These are exactly the failures the reporting describes, and a log-and-map dashboard hides both.
- **What's unproven:** all of it. I proposed three tests: first-click ("find the escalated incident") on the two IAs, a timed triage of 12 tags with and without keyboard, and whether leads trust the debt number against a hand count. None has been run.
- **What I'd change:** the timeout, density defaults and protocol steps are my assumptions. They need real safety owners before any of it is more than a concept.
- **What I cut:** the v1 team-wins panel. Its placement contradicted itself, and none of the jobs I mapped needed it.
