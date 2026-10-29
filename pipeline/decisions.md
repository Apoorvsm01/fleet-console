# Decision log

Every agent appends here. Format:

```
## D-NNN · <stage>/<agent> · <short title>
- Decided: …
- Rejected: … (why)
- Because: … (tie to a job, a user, or a constraint in brief.md)
- Status: proposed | approved (gate N) | OPEN
```

## D-001 · stage0/designer · Build a new B2B design system instead of reusing HMI or Horizon
- Decided: an original, lean system tuned for dense desktop operations.
- Rejected: the Woven HMI system (built for 2-second glances; wrong density for desktop). ServiceNow Horizon (hides the designer's own craft decisions, makes a Toyota tool look like ServiceNow, and has unclear reuse rights).
- Because: the target role values design-system ownership and craft. A new visual language also guarantees the NDA re-creation differs from the real product.
- Status: approved (designer, 2026-10-29)

## D-002 · stage0/designer · Add the fleet lead as a first-class user
- Decided: the console serves two users, test-fleet operators and the fleet lead / remote safety manager.
- Rejected: an operator-only tool (it leaves escalation and oversight load invisible).
- Because: public reporting on AV test programs shows that oversight failures are structural (span of control, single-person escalation, audit backlog).
- Status: proposed

## D-003 · stage1/domain-modeler · Incident is the canonical hub; issue tags are separate, pre-triage objects
- Decided: Issue tag (capture) is distinct from Incident (owned work). Incident links many-to-many to Drive and Vehicle and is reachable from vehicle, drive, hazard, shift, and lead queue.
- Rejected: nesting incidents under Vehicle (breaks multi-vehicle or multi-drive events); treating each tag as an incident (floods the lead, slows 2-second capture).
- Because: capture must be effortless while triage must be fast (brief section 3).
- Status: proposed

## D-004 · stage1/domain-modeler · One 3-level severity scale and one 5-state lifecycle
- Decided: SEV1/2/3, each mapped to a distinct response. Lifecycle Captured, Triaged, Owned, Resolved, Verified; Escalated/Overdue/Stale are flags, not states.
- Rejected: a second scale for damage or data health (v1 flaw); 4+ levels (no behavior change, slower tagging).
- Because: v1 had two severity scales (brief section 4).
- Status: proposed

## D-005 · stage1/domain-modeler · Model Shift, Escalation, and Oversight debt as first-class objects
- Decided: Escalation resolves through Shift coverage with an auto-backup; Oversight debt is a derived object with its own home.
- Rejected: a fixed on-call person field (single point of failure); leaving workload implicit (invisible workload).
- Because: brief section 2B failure modes, used as design pressure only.
- Status: proposed

## D-006 · stage2/ia-architect · Workflow-first IA (Now / Inbox / Owned / Review / Fleet / Plan)
- Decided: top-level nav is verbs and queues; objects are reached through one-hop pages, with Incident as the canonical page.
- Rejected: object-first (derived coverage and debt have no home; "what needs me now" takes four lists; reads like a spreadsheet). Time-first (hides non-time-bound work and old open incidents, recreating the silent backlog).
- Because: the three highest-friction jobs are act-now or see-now, and the most frequent lead jobs are queues (object-model section 3).
- Status: proposed

## D-007 · stage2/ia-architect · `Now` is home and owns Oversight debt and coverage
- Decided: the landing screen shows shift coverage, live escalations and debt counters for the lead.
- Rejected: Inbox as home (hides coverage gaps until someone looks); a separate reporting page only (debt visible weekly, too late).
- Because: brief section 2B "invisible workload" and "oversight backlog".
- Status: proposed

## D-008 · stage2/ia-architect · Surfaces split by job, not by size
- Decided: desktop = triage, review, plan; iOS = reach the right person (escalation ack/hand-off, Now summary); in-vehicle = 1-tap tag pad plus SEV1 call. Power layer: keyboard, Cmd-K, saved views, bulk with undo.
- Rejected: responsive shrinking of the desktop console to iOS and in-car (violates the 2-second glance; triage is wrong on a phone or in motion).
- Because: capture is high frequency and safety-critical in the car; escalation must reach people away from a desk.
- Status: proposed

## D-009 · stage2/ia-architect · IA branches on six object-model questions plus brief Q4
- Decided: ia.md section 2 table shows the IA change for each answer; no answer assumed. Defaults used in section 3 sketches: Q1 per shift, Q2 operators triage own tags, Q6 lead-only iOS first.
- Rejected: silently picking answers (would bake an invented fact into the case study).
- Because: brief rule that unconfirmed items stay marked ASSUMPTION until a gate.
- Status: OPEN (designer answers at Gate 1)

## D-010 · gate1/designer · Gate 1 approvals and answers
- Decided:
  - IA model B (workflow-first) with `Now` as home is approved, which makes D-006 and D-007 approved.
  - The surface split in D-008 is approved.
  - Brief Q4: the need came from **both** operators and leads.
  - Q4: the second responder is an **on-call rota** (adds a roster editor in Plan; timeout and auto re-route stay).
  - Q5: footage is audited for **every incident** (Review is derived from Incidents; no sampling UI).
- Assumptions (pipeline defaults, not confirmed by the designer; never present these as facts):
  - Q1: span is counted per shift.
  - Q2: operators triage their own tags (Inbox "mine" vs lead "team").
  - Q3: technicians are report-only (Repairs is a read-only section on Vehicle).
  - Q6: iOS is lead-first (escalation + Now).
- Rejected: A, object-first (escalation and oversight debt become a search). C, time-first (hides open work older than the shift).
- Status: approved (gate 1, 2026-10-29)

## D-011 · stage3/system-designer · Name and visual direction: "Plumb"
- Decided: calm, precise, neutral-first UI; cool grey scale, one ink-blue accent, Geist and Geist Mono with global tabular numerals; borders before shadows; 3-5px radii.
- Rejected: a warm/brand-red accent (collides with SEV1 and Toyota-adjacent branding); rounded-friendly SaaS look (wrong tone for safety work); Inter/IBM Plex (Plex reads as Carbon).
- Because: D-001 (original system), users are data-comfortable (brief section 2A), and the tool must feel trustworthy at 2 a.m.
- Status: proposed

## D-012 · stage3/system-designer · Severity encoded by label, shape, fill weight, and hue
- Decided: SEV1 solid filled triangle, SEV2 tinted filled diamond, SEV3 hollow ring; each also has a fixed edge-bar width in tables. Red reserved for SEV1 and gaps (hatched). Proposed severity (from a tag type) shows a dashed border and "?".
- Rejected: color-only dots (fail color-blind and grayscale); numeric 1-10 scores (D-004); a fourth level.
- Because: one scale (D-004), WCAG "not by color alone", glanceable weight that falls with urgency.
- Status: proposed

## D-013 · stage3/system-designer · Status is a 5-segment bar; flags are violet pills; no green
- Decided: lifecycle marker = 5 segments + label; Escalated/Overdue/Stale are additive violet flag pills with distinct glyphs; Healthy and Verified use neutral/ink checks; red/amber/teal are never used for status.
- Rejected: green for success (a third hue family competing with severity; also adds a red-green pair); coloring status by severity; ring-fill circles (collide with the SEV3 ring).
- Because: D-004 (flags are not states); keeps hue meaning single-purpose.
- Status: proposed

## D-014 · stage3/system-designer · Density as tokens, two modes; Tailwind-native theme file
- Decided: `data-density` swaps row 36/28, control 32/26, pad, gap, base text 14/13; `data-theme` swaps semantic colors. theme.css uses literal values in `@theme`, `--color-*: initial` to drop default palette, and custom `dark:`/`compact:` variants.
- Rejected: three density modes (no evidence for a third); `var()` chains between semantic tokens (break per-element theme overrides in v4); prefers-color-scheme auto-switch in CSS (builders set the attribute, so the user can override).
- Because: dense operations tool with tables first-class; builders import theme.css directly.
- Status: proposed

## D-015 · stage3/system-designer · Twelve components; coverage bar and escalation card are system primitives
- Decided: table, severity chip, status marker, filter bar, split pane, timeline, map layer, metric tile, coverage bar, escalation card, command palette, empty/loading/error. Bulk bar and undo live inside the table.
- Rejected: leaving coverage and escalation as screen-level one-offs (they are the differentiators in D-005/D-007 and need consistent states); a generic "card" primitive (invites styling drift).
- Because: highest-friction jobs in object-model section 3.
- Status: proposed

## D-016 · stage3/system-designer · OPEN: default density per role, and font licensing/hosting
- Decided: provisional default density is comfortable for leads (Now/Plan) and compact for operators (Inbox/Review/Fleet). Geist is OFL and must be self-hosted (builders add the font files).
- Rejected: forcing one density; hot-linking a font CDN (offline/NDA environments).
- Because: no research on density preference exists; marked ASSUMPTION, not a finding.
- Status: OPEN (designer to confirm). Contrast ratios in tokens.json are hand-computed and must be machine-verified before Gate 2.

## D-017 · stage4/foundation-builder · OPEN: spec gaps found while building the shared layer
- Decided: prototype/src/theme.css is a copy of pipeline/theme.css plus additions: density tokens `--spacing-chip` (22/18) and `--spacing-icon` (16/14) from tokens.json density, and layout tokens `nav`, `nav-collapsed`, `page-min`, `palette`, `edge-1`, `edge-2`, `seg-w`, `seg-h`, `hit`. `--font-sans` also lists "Geist Sans" because @fontsource names the family that way.
- Gaps (OPEN, designer or system-designer to fold into pipeline/theme.css):
  - theme.css has no chip/icon/layout tokens (above).
  - tokens.json defines no "now"/accent line color, no disabled style beyond 60% opacity, and no scrim token (theme.css has `scrim`; tokens.json does not).
  - Escalation timeout length is unspecified; fixtures use 5 min per link (assumption).
  - "Stale escalation" is undefined in the object model; debt counts escalations in the Timed out state (assumption). "Open incident" = Captured, Triaged or Owned.
  - Number keys 1-9 to jump to pinned views (FilterBar spec) and the `?` shortcut sheet are not built.
  - Map clustering, stacked split pane below 1280, column resize/hide, and per-operator coverage load variant are not built (min width is 1280).
  - Q1 per-shift span: lead "span" in fixtures is all of the shift's operators on the primary lead; the backup shows 0.
- Because: foundation for four parallel screen builds; none of this blocks them.
- Status: OPEN

## D-018 · stage5a/orchestrator · Raise contrast of unfilled status segments
- Decided: `status-off` is #7f8b9f (light) and #626e84 (dark), so it reaches ≥3:1 against every surface it sits on.
- Rejected: keeping the faint #cbd0d8 / #3a414e (1.35 to 1.91:1). Unfilled segments show where an item sits in the lifecycle, so they carry meaning and must pass the 3:1 non-text rule.
- Because: Principle "Never trust a single channel". The contrast script (pipeline/scripts/contrast.py) found 6 of 194 pairs failing, all on this token.
- Status: approved (orchestrator)

## D-019 · stage4/now-builder · Now layout; OPEN gaps
- Decided: Now stacks (1) active escalations, 2-up full cards, (2) Oversight debt: hero total (4 cols) + four component tiles (8 cols) each linking to its exact queue, (3) 24h coverage bar (8 cols) beside span-of-control per lead vs 15:1 baseline (4 cols). Debt shown program-wide with delta vs last shift; spans for the current shift. Rejected: tabbed sections (hides the gap), donut/score.
- OPEN: no `/review` or `/inbox` query param reproduces "open incidents" (Captured+Triaged+Owned) exactly; Inbox shows only Captured/Triaged, so tile count and queue may differ.
- OPEN: layout tokens for page padding/section gap do not exist; Now uses `p-pane`/`gap-pane`.
- OPEN: per-operator load (getNow().load) not rendered; no variant in CoverageBar.
- Status: OPEN

## D-020 · stage4/escalation-builder · Escalation takeover: protocol checklist + OPEN gaps
- Decided: fixed 5-step post-incident protocol, all steps always shown, none skippable or conditional (no lead judgment; emergency services step is "dispatched, or operator confirms none needed"). Ticks are timestamped from simulated now. EscalationCard (full) owns ack, hand-off, countdown, chain; rota list and page history sit beside it. Resolve is disabled until acknowledged and all steps are ticked.
- Rejected: letting the lead mark steps "not applicable" (reintroduces judgment at 2 a.m.).
- OPEN: no store mutation for marking an escalation Handled or persisting protocol ticks; both are screen-local (module memory, lost on reload). Needs `resolveEscalation` and protocol fields on Escalation.
- OPEN: protocol step wording is invented, not from the brief; needs review by safety owners. Operator "safety" status is derived only from step 1, since no operator-safety field exists.
- OPEN: layout uses `max-w-[var(--spacing-page-min)]` as a width cap; no dedicated content-max token.
- Status: OPEN

## D-021 · stage4/inbox-builder · Inbox interaction decisions and OPEN gaps
- Decided: scope (Mine = my shift, Team = all) is a segmented control in FilterBar `quick`, stored as `?scope=`. Tags promote to their own incident before severity/owner actions (one incident per tag). Bulk keys: a assign to me, t mark triaged, 1/2/3 set SEV, d dismiss tags. Preview pane has owner select, SeverityChip picker, Timeline.
- Gaps (OPEN):
  - store has no un-assign, un-dismiss, un-triage, so undo works only for severity and for re-assign over an existing owner; other bulk actions show no Undo.
  - No "merge into existing incident" bulk action (triageTags supports it; no picker UI built).
  - Bulk `s` then 1-3 chord not wired in table; direct 1/2/3 used instead.
- Status: OPEN

## D-022 · stage4/incident-builder · OPEN: Incident page gaps
- Back context uses `?from=<encoded in-app path>` (default /inbox). Other builders' links should append it; the page labels the back link from the path.
- No store mutation for "raise escalation", comments, or telemetry markers: Escalate shows a toast stub, comments are session-only, telemetry markers are derived from drive ODD and vehicle data health.
- Targets `/fleet?hazard=ID` and `/review?sel=FR-id` assumed; Fleet must read `hazard`, Review `sel`.
- Reassign menu lists leads only (no operators); "Take ownership" assigns the signed-in user.

## D-023 · fix1/foundation · One key map, one verb vocabulary, missing mutations
- Decided: `lib/keys.ts` is the only definition of shortcuts. Verbs: a acknowledge, m assign to me, r reassign, e escalate, 1/2/3 (or s then 1-3) severity, n advance status, c comment, t triage, d dismiss, h hand off, p call, o open incident, z undo. `v` verify and "Move to Owned" are folded into `n`. `?` opens a sheet generated from the map; the shell handles g-chords, `?` and `z`. ErrorState `r` retries only when blocking. Kbd is drawn in sans so `r`/`l` stay legible; shortcuts print by platform (⌘ vs Ctrl).
- Decided: store gains unassignOwner, untriageTags, undismissTags, raiseEscalation, addComment, setProtocolStep/getProtocol, resolveEscalation (closes D-019 to D-022 store gaps; protocol steps moved to lib/protocol.ts). Ticks persist per session, not across reload, like every other mutation.
- Decided: escalation navigation verb is "Review" (yours) / "View" (not yours) in banner, card and palette; "Acknowledge" is only the act. Banner hides on /now and hides the row for the escalation page you are on. "Unassigned" is the one no-owner word. GY shift is named "Night". Nav badges only for Now, Inbox, Owned, Review. Density toggle is labelled.
- Decided: `?demo=acked` on /escalations/:id preloads Acknowledged, 2 of 5 steps ticked, timer stopped (applied in the shell before render). Ack time is fixture now minus 45 s, not a future 15:43, so relative times stay valid.
- Rejected: keeping `a` as assign (collides with acknowledge on the two surfaces that matter most); per-screen key tables (the cause of the drift); a future-dated ack to match the critique's "15:43" (shows as future time).
- OPEN: pipeline/tokens.json and pipeline/theme.css still lack the prototype tokens (chip, icon, layout, scrim, plus new: bar, topbar, search, step, lane, side, kv, map, sheet, glyph, duration-pulse, surface-glass, track, fg-disabled). Designer to fold in; contrast of fg-disabled is intentionally exempt. `hatch-gap` text contrast is still unverified.
- OPEN: pinned views in the nav have no counts (counting needs each screen's FilterField definitions); Gallery.tsx (a screen-folder file with a foundation lint row) was edited by foundation; screens still hard-code a "Graveyard" filter label in Inbox FIELDS (use the shift name from getShifts()); nav badge rule and "Night" rename need designer sign-off.
- Status: OPEN

- D-NEW-1 (escalation, OPEN): protocol checkboxes are disabled until the escalation is Acknowledged, so ticks always follow ownership. Safety owner to confirm.

## D-024 · fix1/now-builder · Now reorder; open-incidents tile
- Decided: Now order is escalations, coverage + span, debt. Yours = full card (7 cols); others = compact rows (5 cols), so "You must act now" sits only on your card. Gap text ("Uncovered 02:00-06:00 UTC · Night shift") in coverage heading and Gaps tile; SEV chip removed. Tile "Open incidents" replaced by "To triage" = Captured+Triaged incidents, linking `/inbox?scope=team&q=kind:incident` so count equals the queue (closes D-019 OPEN). Hero total is the sum of the four displayed counts, with the arithmetic in its footer. Tile labels shortened to one line.
- Rejected: keeping Owned in the count (no queue shows all three states).
- OPEN: hero no longer equals foundation `programDebt.total` (Owned incidents excluded); Plan route stub still unbuilt; per-operator load not rendered; CoverageBar/MetricTile lint items are foundation-file edits, not done.
- Status: OPEN

D-NEW-1 (inbox, OPEN): Inbox title column is a fixed 288px, not flexible, because DataTable rows use `min-w-max` so an fr track grows to the longest title. Table scrolls horizontally in narrow panes. Foundation could cap fr tracks or pin SEV/ID.
D-NEW-2 (inbox, OPEN): Status undo for "Mark triaged" on a Captured incident goes through unassignOwner(status) since the store has no generic status revert.

- D-NEW-INC-1 Decided: Incident header primary follows state. Unowned: "Assign to me" (m). Owned: "Move to <next>" (n). Verified: none. The Reassign menu (r) shows only once an owner exists, so assigning has one path; the no-owner callout is removed.
- D-NEW-INC-2 Decided: Escalate calls raiseEscalation and navigates to /escalations/:id; if one is active the button reads "View escalation". Comments use addComment (store), no local state.
- D-NEW-INC-3 Decided: Incident page is synchronous, so no LoadingState; missing incident is a blocking ErrorState with ref INC-LOOKUP:<id>.
- OPEN: D-NEW-INC-4 Timeline DriveStrip/RouteMap hit areas (<24px), RouteMap opacity/glass/size tokens, RouteMap error fallback live in shared components I did not edit. Assigning to someone else while unowned needs Reassign visible; revisit if testers miss it.

- D-NEW-F2-1 (foundation, fix round 2) Decided: EscalationCard `compact` is a full-width two-line row (chip, ID, flexible title, "Waiting on <name>", timer, action); one SEV mark only. CoverageBar gap labels use container queries (full / "Uncovered" / "Gap"). Status: closed. OPEN: container-query breakpoints use rem literals in CoverageBar, not tokens.
- D-NEW-ESC-1 Decided: Escalation page grid is fluid left column plus right column at --spacing-side (384px, nearest token to 400), left-aligned to header padding. Resolve button now truly disabled (was never passed disabled) with reason inline; operator and rota names truncate with title tooltip. Names inside shared EscalationCard not touched. Status: closed.

- D-NEW (Inbox, gate 2 #1): Vehicle column dropped from the inbox table (still searchable, shown in preview and row tooltip); Title is the only flexible column; Status uses the inline marker with label; row flag pills moved to tooltip. Title cell uses `w-0 min-w-full` because DataTable rows are `min-w-max`. OPEN: DataTable rows should not size 1fr tracks to max-content (foundation).
- D-NEW (Inbox, gate 2 #3): SEV? legend row under the filter bar, plus tooltip on proposed chips in the table (SeverityChip itself has no tooltip for `?`; OPEN for foundation).

D-NEW-R2B-1 (DataTable, closed): rows no longer use min-w-max when any column is flexible (no `width`), so the fr column shrinks to the pane; fixed-only tables keep min-w-max and scroll sideways. Added optional Column.minWidth. Supersedes D-NEW-1 / the gate-2 OPEN.
D-NEW-R2B-2 (Inbox, closed): preview capped at 440px via new optional SplitPane `detailMax` prop (spacing units; SplitPane edited outside the assigned list). Owner is an initials avatar with tooltip; Unassigned is a dashed "—" avatar, aria-label "Unassigned"; Age uses fmtAge (14m/3h/2d).
D-NEW-R2B-3 (EscalationCard, closed): chain names truncate to one line with title tooltip; status moves beneath the reach line below the @md container width (448px), inline at the right above it. OPEN: @md is a Tailwind default, not a token.

D-NEW-P1 (EscalationCard): SEV ring no longer scales outside the chip; opacity-only pulse, radius inherited, hidden under reduced motion.
D-NEW-P2 (EscalationCard/COPY): Acknowledge only for the paged person (view.isMine). Others get View (secondary) plus Take over in a ⋯ overflow behind a confirm. Banner and palette already offer only View for non-owners and no Acknowledge. OPEN: palette has no Take over command.
D-NEW-P3 (Inbox): scope 'mine' relabelled 'My shift'; content = assigned to me OR (my shift AND Captured/untriaged). Team unchanged.
D-NEW-P4 (Inbox): Sev column widened 24 to 32 so SEV?-chips do not clip.

## D-025 · stage3x/system-designer · Surfaces are a token layer plus new components, not forks
- Decided: `theme-surfaces.css` is scoped by `data-surface="ios|vehicle"` over theme.css. It remaps Plumb's existing scale names (`text-xs`...`2xl`, `row`, `ctl`, `pad`, radius, duration) per surface, so carried components (SeverityChip, StatusMarker) resize without code changes. Severity, status, flag semantics and shapes are untouched.
- Rejected: a separate design system per surface (forks semantics, the v1 flaw); responsive shrinking of the desktop console (D-008); new surface-only color names (builders would restyle severity).
- Because: D-004, D-012, D-013 ("one scale, one lifecycle").
- Status: proposed

## D-026 · stage3x/system-designer · iOS: SF Pro stack, native structure, Geist Mono kept
- Decided: sans = `-apple-system`/SF Pro (Geist fallback); Geist Mono for IDs and timers. Type 12/13/17/22/28/34, targets 44 pt, row 64, radii 6/10/14/24 (chips stay rectangles). Tab bar: Escalations (home), Now, Incidents. Takeover is a full-screen cover that cannot be swiped away until acknowledged. Incident is read plus notes only. Push titles carry a text "SEV1 ·" prefix.
- Rejected: Geist everywhere on iOS (feels foreign, loses Dynamic Type); a compact density mode (thumb reach); swipe-only Acknowledge (hidden affordance); editing severity/status on the phone (one-hand error risk); pill-shaped chips (erode the shape code).
- Because: ia.md section 4 (iOS = reach the right person fast); D-005 (no single point of failure).
- Status: proposed

## D-027 · stage3x/system-designer · Vehicle: glance budget, 76 px targets, shape+position severity, night default
- Decided: glance budget = 1 headline (<= 4 words), 1 number, 1 target per screen; type floor 32 px, min target 76 px, >= 24 px between targets; TagPad is one row of 3-5 fixed 288x320 keys ordered by proposed severity and never re-sorted; SEV1 = full-screen takeover, SEV2/3 = top band only; one alert layer at a time. No shadows, no pulse or any motion except one 120 ms toast fade. Night ground #0a0b0e with all text >= 7:1; day is the variant (`data-ambient`). Undo key on the toast instead of confirm dialogs. Guided call = one step, one Done key, voice-read; steps from the shared protocol.
- Rejected: shrinking the tag list into a scroller (violates no-lists); color-only severity (V3); the desktop SEV1 pulse (draws the eye); confirm dialogs before capture (costs a glance); usage-sorted keys (breaks muscle memory); a map in the car (navigation owns it).
- Because: the designer's 2-second glance standard; capture must be effortless (brief section 3); brief surface list.
- Status: proposed. ASSUMPTION: 32 px floor, 3 s toast, 4-word budget and 600 ms debounce are my numbers, not research findings.

## D-028 · stage3x/system-designer · OPEN: questions for the human (surfaces)
- Moving-vehicle lockout for call steps (voice-only above a speed?), driver side/handedness for key order and End/Done separation, whether the call includes emergency services, Apple Critical Alert entitlement, and confirming the glance numbers against Drive Coach. Guided-step wording remains a placeholder (see D-020).
- Also OPEN: tokens.json not yet updated with surface tokens (chip/icon/target/band etc.); contrast ratios in theme-surfaces.css are hand-computed and need machine verification.
- Status: OPEN

## D-029 · surfaces/orchestrator · Defaults for open in-vehicle and iOS questions
- Decided (ASSUMPTIONS, not confirmed by the designer):
  1. The tag pad stays 1-tap at any speed, because a single tap is the glance-safe action. Guided call steps advance by voice or by the operator's spoken confirmation, with no typing ever.
  2. Left-hand drive (US test fleet). The most severe tag key sits nearest the driver.
  3. The guided call includes "emergency services needed?" as a step, mirroring desktop protocol step 3.
  4. iOS SEV1 escalations use Critical Alerts (assumed granted for a safety program).
  5. Glance numbers (32px floor, 3s toast, ≤4-word headline) are proposals built on the designer's 2-second glance standard from Drive Coach. They are not new research.
- Rejected: voice-only lockout above a speed threshold (it adds a mode the operator must track, and a tag is already 1 tap).
- Status: proposed (confirm at the surfaces gate)

## D-030 · vehicle-builder · In-vehicle co-pilot build
- Decided: one 168 px zone between strip and keys hosts hazard band OR toast OR the voice hint (hazard > toast), so keys never move and no 6th zone is needed. TagPad = Phantom brake, Planner freeze, Sensor drop, Lane drift, Other; LHD so left is nearest driver; fixture severities tie at SEV2 (Other SEV3), ties keep configured order. Toast = 120 ms fade, 3 s dwell, Undo for the same 3 s (spec said 4 s; the brief said 3 s). Emergency steps (safe, vehicle safe, emergency services, preserve data) map to protocol ids safe/location/emergency/preserve via setProtocolStep, so ticks show in the desktop escalation. Done is a button plus voice ("done" via SpeechRecognition where available). Frame: bezel by default, `?frame=0` bare, `?mode=day`.
- Rejected: a separate toast zone (no vertical room: 80+168+320+gaps).
- OPEN: store has no captureTag/removeTag, so the vehicle pushes to TAGS directly and uses `undismissTags([])` as a no-op notifier. Add real store mutations.
- OPEN: protocol has a 5th step (notify) the car never ticks; the lead finishes it on desktop.
- OPEN: no chime/offline state/Call-backup key built; call connect and timer are simulated (4 s).
- OPEN: ESC-0206's reroute target is the signed-in user (LD-04), so the "lead" the driver calls is the desktop user.

## D-031 · ios-builder · iOS surface built at /ios/*
- Decided: routes esc, esc/:id (takeover), now, inbox, me, inc/:id, lock; phone frame with `?frame=0` bare, `?theme=`, `?empty=1` (forces the calm empty state), `?demo=acked` on takeover. Protocol, ack, hand-off, resolve use the shared store, so ticks show on desktop. ios.css is plain CSS (not a Tailwind entry), so surface tokens are used as `h-(--spacing-target)` and `.t-largetitle`.
- Lock-screen mock uses ESC-0206 (mine, re-routed) rather than ESC-0207: body says "Re-routed to you, mm:ss left" because I am last on the chain (no backup to name).
- Bare view keeps safe-area padding (meant for a real device).
- Status: proposed
- OPEN: swipe-to-acknowledge on rows not built (spec says shortcut only). Mini-map in Incident read not built (list only). Inbox search field (`#INC`, `@name`) not built. Takeover "cannot swipe away" is a hidden back button only, not a gesture block. Dynamic Type not exercised. Call is a toast, no real call.

## D-032 · foundation-fix · Store captureTag/removeTag, vehicle uses them
- Decided: `captureTag(input)` and `removeTag(id)` live in lib/store.ts and call `bump()`. `proposedSev` comes from `TAG_TYPE_SEV` (Phantom brake, Planner freeze, Sensor drop, Lane drift, Late yield SEV2; HMI glitch, Other SEV3), the same value the Inbox shows as SEV?. The vehicle no longer touches TAGS. `removeTag` only removes still-Captured tags.
- Also fixed: the vehicle tag debounce started at 0, so a tap within 600 ms of page load was silently dropped.
- Proof: prototype/scripts/check-handoff.mjs (vite on 5183) PASS.
- Closes the D-030 OPEN on captureTag/removeTag. Status: proposed

## D-033 · foundation-fix · Vehicle emergency flow covers protocol steps 1-4 only
- Decided: the 4 guided steps map 1:1 to safe, location, emergency, preserve. Step 5 (notify) is the lead's and is never ticked by the car; the final screen reads "4 of 5 logged. Lead briefs the next responder."
- Closes the D-030 OPEN on the 5th step. Status: proposed
- OPEN: the severity map is invented and needs safety-owner review.

## D-034 · foundation-fix · One vocabulary (COPY glossary)
- Decided: debt queues are Footage / To triage / Re-routed / Gaps (the "Stale escalations" tile becomes Re-routed, freeing "Stale" for the 72 h incident flag only). Escalation order Paged, Timed out, Re-routed, Acknowledged, Handled. Roles Primary, Backup, Escalation owner (never "Held by" / "Calling"). Clock reads "mm:ss left before it re-routes".
- Applied to src/components and src/screens. src/surfaces not yet adopted.
- OPEN: DB state value 'Raised' still displays as "Raised" on the chain's first row; glossary calls the state "Paged". Not renamed to avoid a data-model change.
- OPEN: Escalated flag vs Re-routed state still both appear on Inbox rows; confirm the flag should stay.
- Status: proposed

## iOS fix round (critique 03)
- D-NEW-1: iOS takeover uses `mine` (current owner is me), not `isMine` (paged), so the owner never sees non-owner copy. Acked shows "You acknowledged at HH:MM. Countdown stopped. Next: <step>."
- D-NEW-2: Hero card primary is Acknowledge (one tap, toast), Review is secondary. Acked takeover bar is one row: Hand off + "Resolve · N steps left".
- D-NEW-3: Demo links, entitlement note and "fixture data" removed from the phone UI. Navigation lives in a "Presenter notes" aside outside the frame (hidden when frame=0).
- D-NEW-4: Tab badge is 0 under ?empty=1.
- OPEN: haptic on Acknowledge not implemented (web). Incident-read, Inbox and hand-off sheet findings (10-12) not in this pass.

## D-NEW (vehicle fix round)
- Guided steps: questions get answer keys (Are you safe? Yes/No; Emergency services needed? Yes, call/No); others are imperatives with Done. "No" on safety shows help state ("Stay put. Help's coming.") with one key, "I'm safe now"; the step is not ticked.
- Emergency right column: "Calling"/"Connected", first name, one number (pre-connect countdown in hero 120px; call timer counts up in xl 72px), End call. No IDs. The timer runs. Done state has one exit, End call, which returns to tags.
- Car tag keys drop the "?" and dashed chip (tags are proposed; stated here, not in the car). Autonomy square removed (text only). Toast is "Logged · type" plus Undo. Secondary targets are 96px (--spacing-btn).
- Shoot script measures min computed font and min target per state and fails below 32/76.
- OPEN: spec should state that step 1 and 3 have two answer keys; pre-connect countdown semantics are simulated.
