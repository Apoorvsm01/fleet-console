# IA: Fleet Console

Inputs: brief.md, object-model.md. Fixture data only. Items marked **[Qn]** depend on an object-model open question (section 5 there); see the table in section 2.

## 1. Competing models

**A. Object-first** (Vehicles / Drives / Incidents / Footage / Shifts / Campaigns)
- Nav: `Vehicles | Drives | Incidents | Footage | Shifts | Campaigns`
- Fast: look up a vehicle's history, check campaign ODD, review data health.
- Slow: "what needs me now?" The lead must open four lists to find the work. Coverage gaps and oversight debt have no home (they are derived and cross-object). Escalation is buried under Incidents.
- Scaling: beginners must learn our object vocabulary first. Power users get filters and tables (spreadsheet-like), which is the thing we are meant to replace.

**B. Workflow-first** (Now / Inbox / Owned / Review / Fleet)
- Nav: `Now | Inbox | Owned | Review | Fleet | Plan`
- Fast: escalation, triage (tags + incidents in one queue), follow-up to Verified, footage queue, coverage gaps.
- Slow: ad hoc exploration ("everything about vehicle X"). Mitigated by one-hop object pages.
- Scaling: beginners follow the queue top to bottom; power users filter, bulk-act and save views of the same queues.

**C. Time-first** (shift timeline: Now / This shift / Last 24h / Week)
- Nav: `Live shift | Timeline | Handover | Week`
- Fast: handover between the three 24/7 shifts, "what happened while I was off".
- Slow: anything not time-bound (campaign coverage, repairs, one vehicle's chronic fault). Old open incidents scroll out of view, which recreates the silent backlog.
- Scaling: good for one lead on one shift, weak for operators and for weekly reporting.

## 2. Recommendation: B, workflow-first, with `Now` as home

Why, from the jobs table:
1. The three highest-friction jobs are all "act or see now": escalation (safety-critical, per event), coverage and debt visibility (continuous), and capture (per drive). Only B puts these on the first screen. A makes them a search; C hides the non-time-bound ones.
2. The most frequent lead jobs (triage several times daily, follow-up daily, footage daily) are queues. A queue is the natural unit, and an empty queue is the success state. That is also how we show that oversight debt is falling.
3. Objects stay reachable: Incident gets one canonical page with entry points from Inbox, Vehicle, Drive, Hazard, Shift (object-model navigation-hard list). Verbs on top, objects underneath.
4. `Now` is the home of the derived Oversight debt object, so overload is visible before an incident.

Cost accepted: Fleet browsing is one level down. Operators who think by vehicle use Fleet and the command palette.

**Open-question dependence**

| Question | If answer is X | IA change |
|---|---|---|
| Q1 span per shift vs per program | per shift | `Now` shows one shift's operators and debt. |
| | per program | `Now` adds a program-wide strip (all three shifts); Shift becomes a switcher. |
| Q2 operators triage own tags | yes | Inbox is operator-visible, scoped "mine", with lead view "team". |
| | lead only | Operators see tags as read-only status; Inbox is lead-only. |
| Q3 technicians in tool | yes | Add a technician role view of Fleet > Repairs; Owned includes repair work. |
| | report only | Repairs are a section on Vehicle; status read-only. |
| Q4 second responder | peer lead / manager / rota | Escalation chain UI shows a named role; "rota" adds a roster editor in Plan. Timeout and auto re-route are fixed either way. |
| Q5 footage audit | sampling | Review shows a sampled queue plus sampling-rate setting. |
| | every incident | Review is derived from Incidents (no sampling UI). |
| Q6 iOS scope | lead-only | iOS = escalation + Now. |
| | plus operators | iOS adds capture and own-tag triage. |
| Brief Q4 (operators, leads, both) | operators only | Demote `Now` coverage; Inbox is home. |
| | leads only | Operators lose desktop; capture lives only in-vehicle/iOS. |

**To de-risk, test:** (a) first-click test, "an incident was just escalated, find it", B vs A with prototypes; (b) a 5-minute task: triage 12 tags in Inbox with and without keyboard; (c) whether leads trust the `Now` debt number (does it match what they would count by hand). Coordinate with the UX research team the designer already feeds. No outcomes claimed.

## 3. Screen inventory (desktop)

| Screen | Job | Primary object | Entry points | Above the fold / one click deep |
|---|---|---|---|---|
| **Now** | Know coverage, debt, live escalations | Shift, Oversight debt | Home, `g n` | Fold: coverage bar by shift (gaps red), active escalations with timers, debt counters (unreviewed footage, open incidents, stale escalations). Deep: debt history, per-operator load. |
| **Inbox** | Triage tags and new incidents | Issue tag, Incident | Nav, notification, `g i` | Fold: list grouped by SEV, preview pane, triage actions (join/create incident, set severity, dismiss). Deep: filters, saved views, bulk. |
| **Incident** | Own one problem to Verified | Incident | Inbox, Vehicle, Drive, Hazard, Shift, palette | Fold: severity, status, owner, escalation chain, linked drives/vehicles, tag timeline. Deep: telemetry, footage clip, notes, audit trail. |
| **Escalation takeover** | Receive, ack, hand off | Escalation | Push, Now | Fold: incident essentials, Ack, Hand off, backup name and countdown. Deep: full incident. |
| **Owned** | Follow-up my incidents/repairs | Incident, Damage | Nav, `g o` | Fold: my items by status; stale flagged. Deep: Verify by another person. |
| **Review** | Clear footage queue | Footage review | Nav, Incident | Fold: queue with due/overdue, player. Deep: findings. |
| **Fleet** | Look up assets | Vehicle, Drive, Hazard | Nav, palette | Fold: vehicle table with condition and data health. Deep: Vehicle page (repairs, drives), Drive page, hazard map. |
| **Plan** | Campaign ODD, roster, reporting | Campaign, Shift | Nav | Fold: ODD vs targets. Deep: roster editor, workload report for leadership. |

## 4. Cross-surface split

| Surface | Best at | Does | Does not |
|---|---|---|---|
| **Desktop** (ops/triage) | Density, comparison, bulk | Everything in section 3; Review; Plan; reports | Not the place to receive the first alert |
| **iOS** (on the go) | Reaching the right person fast | Escalation ack/hand-off, `Now` summary, Incident read plus quick notes, push. **[Q6]** operator capture and own-tag triage only if operators in scope | No bulk triage, no ODD planning |
| **In-vehicle** (2-second glance) | Capture | 3 to 5 large 1-tap issue tags, SEV1 emergency call with guided steps, hazard ahead alert, tag-confirmed toast | No lists, no triage, no browsing. Severity proposed automatically from tag type; lead corrects later. |

Each surface speaks the same objects and the single severity scale, but its main screen is different: coverage board, escalation inbox, tag pad.

## 5. Power-user layer

- **Keyboard:** `j/k` move, `Enter` open, `e` escalate, `a` assign owner, `s` set severity (1/2/3), `x` select, `d` dismiss, `v` verify, `g` + letter to navigate, `?` shows the sheet. Every action has a visible hint on hover so beginners learn them.
- **Command palette** (`Cmd-K`): jump to any vehicle, drive, incident, operator; run actions on the current selection.
- **Saved views:** filter + sort + grouping on any queue, shareable, pinned under the nav (for example "SEV2 unowned, night shift").
- **Bulk actions:** multi-select in Inbox, Review and Fleet; assign, set severity, merge into one incident, mark reviewed. Undo for 10 s.
- **Beginner path:** default views, plain verbs on buttons, empty states that say what to do next.

## 6. Build first (desktop prototype)

1. **Inbox** (triage): densest interaction, shows beginner vs power-user mastery, and the tag-to-incident model.
2. **Incident page**: the hub; everything links here; carries the single severity and lifecycle.
3. **Now**: the differentiator; makes coverage and oversight debt visible.
4. **Escalation takeover**: addresses the top friction job (no single point of failure) with backup countdown.

In-vehicle tag pad and iOS escalation are the next builds, after the desktop four.
