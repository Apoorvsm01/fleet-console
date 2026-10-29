# Brief: Fleet Console (Drive Coach fleet concept, re-created)

> Stage 0. Ground truth for every agent. Written by the designer with Opus, 2026-10-29.
> Items marked **[DESIGNER]** were stated by the designer. **[SOURCE]** is public material. **[ASSUMPTION]** must be confirmed at a gate.

## 1. What this is

- **[DESIGNER]** The designer (UX Engineer at Woven by Toyota, 2025 to now) owned UX research, design, and prototyping on Drive Coach. Drive Coach is an in-car AI driving coach.
- **[DESIGNER]** The designer **self-initiated** a fleet concept: a **desktop fleet-operations tool**, an **iOS counterpart**, and an **in-vehicle co-pilot** surface. They proposed it to their own team after hearing about a need in a conversation with a different team inside the company.
- **[DESIGNER]** Their deliverable was **material for a separate UX research team**. Measuring outcomes was not their job, so **the fleet concept has no metrics.** Never invent any.
- **[DESIGNER]** Under NDA, everything shown is a **re-creation**. Screens must be a **different design** from the real thing. That is why this project uses a new, original design system.
- **[DESIGNER]** The Generative Drive Coach (in-car voice coach) study results are the designer's own. They can be referenced as context, but only for that project:
  - 100+ drivers' research → 22 scenarios
  - 70% understood re-timed voice prompts (a 50% improvement)
  - 40% faster to act in a 25-person simulator study
  - 80% of 35 participants preferred a quieter AI

## 2. Users

**A. Test-fleet operators** (engineers / technicians who drive prototype automated vehicles). **[DESIGNER]** says the company's test-driver model matched the industry pattern. The industry role description (paraphrased from a public test-driver job posting) covers:
- Vehicle-level testing and validation of driver-assist / automated-driving features (e.g. lane keeping, emergency braking, self-driving modes).
- Precision maneuvers at or beyond system limits, on closed courses and public roads.
- **Triaging vehicle-behavior issues by analyzing data** in internal tools.
- **Documenting test-vehicle condition** and **coordinating repairs / retrofits with technicians**.
- Ad-hoc engineering test requests, frequent travel, strict confidentiality about prototypes.
- The role values high situational awareness and attention to detail, plus Excel/Python familiarity. These users are technical and comfortable with data and density.

**B. Fleet lead / remote safety manager**. **[SOURCE]** Public 2025 reporting on a lawsuit about a *competitor's* automated-driving test program. These are allegations, not findings. It describes the remote fleet manager as **the human safety redundancy** for hazards, emergencies, and post-collision protocol. Their duties:
- auditing onboard driving footage
- weekly ride-alongs
- following up every safety incident
- being on call for operators' emergency calls

Failure modes alleged in that reporting (useful as design pressure, **not** as claims about any specific company):
- **Span of control.** One lead covering ~38 operators against a stated ~15:1 baseline, across **three 24/7 shifts**.
- **Single point of failure in escalation.** A collision call at ~2 a.m. went to one exhausted lead. The guidance was poor and the operator stayed at an unsafe scene for about an hour.
- **Oversight backlog.** Footage audits and incident follow-ups silently didn't get done.
- **Invisible workload.** The lead escalated the overload by email. Leadership didn't act, and the lack of staffing showed up only after an incident.

**[DESIGNER]** Competitor names must **never** appear in the portfolio. They may appear only in a clearly labeled competitive-analysis note.

## 3. Problem framing (to be sharpened by stages 1–2)

Test programs grow faster than oversight. Operators capture issues in the moment, triage them later in scattered tools, and depend on one human for escalation. Leads cannot *see* their oversight debt (unreviewed footage, open incidents, uncovered shifts) until something goes wrong.

The concept's job is to make **capture effortless**, make **triage fast**, make **escalation never depend on a single person**, and make **oversight load visible** before it becomes a safety problem.

## 4. Surfaces

The re-creation v1 is already in the portfolio. It may be redesigned freely.
- **Desktop fleet console** (primary; the portfolio centerpiece). v1 had:
  - incident log with SEV1–3
  - hazard route map
  - damage summary
  - telemetry and data health (write-rate, storage, sensor sync)
  - ODD (operational design domain) coverage vs campaign targets (day / night / rain / dense traffic)
  - a "team wins" morale panel
  - Known v1 flaws: two severity scales, team-wins placement contradictions, no full-screen views.
- **iOS counterpart**: on the go, for leads and operators away from a desk. **[ASSUMPTION]** Its exact scope is to be defined.
- **In-vehicle co-pilot**: v1 had 1-tap issue tags (e.g. phantom brake, planner freeze, sensor drop), telemetry, and a hazard map. Must be glanceable; the designer's Drive Coach work used a **2-second glance** standard.

## 5. Target audience for the case study

Senior Product Designer at Ashby (desktop B2B SaaS). The role values:
- first-principles thinking over standard process
- narrowing problems by asking questions
- layout, navigation, IA, and interaction depth
- visual craft
- PM-like ownership
- designs approachable to beginners yet mastered by power users, in place of spreadsheets

It de-emphasizes personas and journey maps.

## 6. Constraints

- Original visual language. Do not copy Horizon, Carbon, Polaris, the Woven HMI system, or the real product.
- Invented fixture data only. No real vehicle IDs, places, people, or internal tool names.
- Light and dark themes, WCAG AA, keyboard-first power-user paths.

## 7. Open questions for the designer

1. What was the hardest structural problem in the original concept? (Gate 1 will offer options to react to.)
2. Was the proposal adopted, shelved, or folded into something else?
3. What exactly did the research team receive, and what did they do with it?
4. ~~Operators, leads, or both?~~ **Both** (designer, gate 1).
