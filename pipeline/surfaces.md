# Plumb surfaces: iOS and in-vehicle

Extends `tokens.json` / `theme.css` / `components.md`. Split per `ia.md` section 4 (approved, D-010). CSS: `theme-surfaces.css`, selected by `data-surface="ios"` or `data-surface="vehicle"` (+ `data-ambient="night|day"`). Fixture data only. Numbers marked **[A]** are my proposals, not research findings: validate in the UX research team's tests before they become claims.

## 0. What never forks

| Constant | Rule on every surface |
|---|---|
| Severity | SEV1 solid triangle, SEV2 tinted diamond, SEV3 hollow ring; label always present; red/amber/teal. Proposed severity = dashed border + "?". |
| Status | Captured, Triaged, Owned, Resolved, Verified. Escalated/Overdue/Stale are violet flags. No green, no sixth state. |
| Hue meaning | red/amber/teal = severity; violet = flag; ink = interaction; neutral = everything else. Hazards are neutral squares, never a severity. |
| Escalation | Raised, Acknowledged, Handled, Timed out; countdown to backup; Esc-equivalent never silently dismisses an unacknowledged card. |
| Type | Tabular numerals; Geist Mono for IDs and timers. |

What may change: size, space, radius, motion, input model, and the ground (vehicle night). Only the vehicle night ground re-states sev hues (sev2 line, brighter marks) and only to meet higher contrast; same hue family.

## 1. Token deltas

### 1.1 Type

| Role | Desktop (comfortable) | iOS | Vehicle |
|---|---|---|---|
| Sans | Geist | `-apple-system`, SF Pro stack; Geist fallback | Geist (no SF in car) |
| Mono | Geist Mono | Geist Mono (IDs, timers) | Geist Mono (IDs, countdown, distance) |
| `xs` | 11/16 | 12/16 caption1 (chips) | 32/36 |
| `sm` | 12/16 | 13/18 footnote | 32/36 |
| `base` | 14/20 | 17/22 body | 40/44 key label |
| `md` | 16/24 | 17/22 headline (600) | 40/44 |
| `lg` | 20/28 | 22/28 title2 | 56/60 alert headline |
| `xl` | 28/32 | 28/34 title1 (metric value) | 72/76 guided instruction |
| `2xl` | 40/44 | 34/41 large title | 120/120 mono: countdown, distance |
| Extra names | none | `subhead` 15/20, `timer` 56/60 mono | `glance-sm/md/lg/xl/hero` = 32/40/56/72/120 |
| Weight | 400/600 | 400/600/700 (large title) | 600 default, 700 headline. No 400 anywhere. |
| Floor | 11 | 12 | 32 |

iOS maps to system text styles so Dynamic Type works in native; the px values are the default (Large) size. Builders of the web prototype use them as-is. Layouts must survive up to accessibility sizes by wrapping, not truncating, severity and status text.

### 1.2 Target sizes and spacing

| Token | Desktop | iOS | Vehicle |
|---|---|---|---|
| Min target (`target`) | 24 | 44 pt | **76 px** |
| Primary target | 32 | 50 pt buttons | TagKey 288 x 320; EmergencyCall 160 high |
| Row | 36 / 28 | 64 (two-line), 44 min | none (no rows) |
| Control height (`ctl`) | 32 / 26 | 44 | 76 |
| Pad / gap | 12 / 12 (8 compact) | 16 / 12 | 24 / 24 |
| Between adjacent targets | 4 | 8 | **>= 24** (pitch >= 100) |
| Screen margin (`pane`) | 16 | 16 | 48 safe frame |
| Chip / glyph | 22 / 12 | 24 / 14 | 56 / 48 |
| Fixed chrome | topbar, nav | safe-top 59, nav bar 44, tab bar 49, safe-bottom 34 | band 168, toast 120 |
| Density modes | comfortable, compact | comfortable only | single (large) |

Vehicle frame math: 1680 - 2 x 48 = 1584 usable. Five keys: 5 x 288 + 4 x 24 = 1536. Three keys stretch to 480 wide. Vertical: 720 - 96 margin = 624 = status strip 80 + gap 24 + key 320 + gap 24 + toast zone 120 + slack.

### 1.3 Radius

| | Desktop | iOS | Vehicle |
|---|---|---|---|
| chip / flag | 3 | 6 (still rect, not pill) | 8 |
| control | 5 | 10 | 12 |
| card / row group | 8 | 14 (inset grouped) | 20 (TagKey) |
| sheet / takeover | n/a | 24 top corners (native uses system radius) | 28 |

Why bigger: larger radii read as touch targets on a phone and in a car; chips keep rectangles so severity shapes stay the identity.

### 1.4 Elevation

iOS: hairline 0.5 pt separators, system material (`surface-glass`) on bars, `shadow-2` on toast, scrim on sheets. Vehicle: no shadows at all (lost in glare and at night): separation by 3 px borders and ground steps.

### 1.5 Motion

| | Desktop | iOS | Vehicle |
|---|---|---|---|
| Durations | 90 / 150 / 240 | 100 / 200 / 350; sheet 350 on a decelerating spring curve | 0 / 0 / 120. Only the toast fades in once. |
| Allowed | highlight, SEV1 ring | push, sheet, list insert, SEV1 ring (1600 ms) | none other: no slide, scale, bounce, pulse, blink |
| Reduced motion | durations to 0 | durations to 0; sheets cross-fade | already minimal |
| Haptics / sound | none | success tap on Acknowledge; SEV1 uses the critical-alert sound **[needs Apple entitlement, see section 5]** | one soft chime on tag confirmed; SEV1 and hazard use voice + chime (spoken text equals on-screen text) |

Rule: motion in the car must never be the only signal and never draw the eye away from the road. Anything that would flash is replaced by a static, larger element.

### 1.6 Night palette (vehicle default)

Ground `canvas #0a0b0e`, `surface #171a21`, `raised #1d212a`. Text `#ffffff` (19.5:1), `fg-muted #e1e4e9`, `fg-subtle #cbd0d8` (12:1: no dim text exists). Accent `#c6d4f9` (12:1). Key border `#626a78` (3 px, 3:1+).

| Severity | mark (on canvas) | text on tint | tint | Notes |
|---|---|---|---|---|
| SEV1 | `#f28075` 7.6:1 | `#ffb4ab` | `#3a1512` | solid fill uses `#0a0b0e` text, 7.6:1 |
| SEV2 | `#f2b134` 10.4:1 | `#f5c25b` | `#3a2a08` | line raised from `#b26a00` to match mark |
| SEV3 | `#4fc3cc` 9.4:1 | `#7dd3da` | `#0f2e31` | |

All text >= 7:1 (AAA), all UI marks >= 3:1; targets exceed AA by design because glance reading is degraded by vibration and glare. Never pure white fills over large areas at night (glare): white appears only as text; the largest light fill is a primary key in `#c6d4f9`. **Day** (`data-ambient="day"`) is high-contrast light: canvas `#fff`, fg `#0a0b0e`, SEV2 darkened to `#8a5300`. Ambient switching is by sensor or time, user-overridable. All ratios are hand-computed and must be machine-verified.

---

## 2. iOS

### 2.1 Structure

Tab bar (3): **Escalations** (home, badge = unacknowledged count, shown as a number), **Now**, **Incidents** (recent + search). Large titles collapse on scroll. Takeover is a full-screen cover, not a tab. Scope is lead-first (D-010 Q6 assumption): no operator capture, no bulk triage, no ODD planning.

### 2.2 Component mapping

| Plumb primitive | iOS | Notes |
|---|---|---|
| Severity chip | **Carries over** | 24 high, 12 pt text, same shapes. Row hit area is the row (44+), not the chip. |
| Status marker, flags | **Carries over** | Segments 8 x 4. Label stays visible; flags wrap to a second line before truncating. |
| Timeline | **Carries over** (vertical feed only) | Drive strip dropped. 44 pt min per expandable event. |
| Metric tile | **Changes** | 2-up grid on Now, value `xl`; whole tile is the link; no hover definition: long-press shows it. |
| Empty / loading / error | **Carries over** | Skeletons; "All clear" success states for an empty escalation inbox; error names the channel (push/network). |
| Map layer | **Changes** | Inline mini-map only, in Incident read; 44 pt marker hit areas; list equivalent below. |
| Escalation card | **Changes** to EscalationRow and EscalationTakeover | See new. Same states and chain. |
| Coverage bar | **Changes** | Read-only 24h strip on Now with gap text ("Uncovered 02:00-06:00"); no rota editing. |
| Data table | **Replaced** by inset-grouped list of EscalationRow / IncidentRow | No columns, no bulk bar, no multi-select. |
| Filter bar | **Replaced** by segmented control (Mine / Team) + Filter sheet | Active filters shown as a one-line summary under the title. |
| Split pane | **Replaced** by push navigation | List, then detail; swipe-back. |
| Command palette | **Replaced** by the Incidents tab search field | Same parser for `#INC-id`, `@name`. No `>` actions. |
| Keyboard layer | **Dropped** | External-keyboard shortcuts are out of scope. |

New components:

| Component | Anatomy and rules |
|---|---|
| **TabBar** | 3 items, icon + label always (no icon-only). Badge = number on Escalations. Material `surface-glass`. Inactive `tab-inactive` (5:1+). |
| **LargeTitleBar** | 34/41 title, collapses to 17 semibold; trailing action <= 1 (44 pt). Subtitle line for active scope/filter. |
| **EscalationRow** | Min 64. Leading SEV chip (24) + 4 pt edge bar as in the table (SEV1 4, SEV2 3). Line 1: title (1 line, wraps at large type). Line 2: mono INC id, vehicle id, "Waiting on <name>". Trailing: mono countdown (`md`, 600) and a chevron. Flags below if present. States: Raised (ring on glyph, countdown running), Acknowledged (who/when, countdown stopped), Timed out (Escalated flag + "Re-routed to <role>"), Handled (collapsed, check). Leading swipe = Acknowledge, trailing = none; swipe is a shortcut only, every action also exists in the takeover. Sorted SEV, then time left. Rows never reorder under the thumb (new ones queue behind "2 new"). |
| **EscalationTakeover** | Full-screen cover from push or row. Order: SEV1 chip, incident title, vehicle id; chain (Raised by, Current owner, Backup + reachable); countdown (`timer`, mono, with progress bar); **Acknowledge** (50 pt, primary, full width, bottom, above safe area); **Hand off** (secondary) opens HandOffSheet; Call operator (secondary); Open incident (link). `interactiveDismissDisabled` until acknowledged; after ack it can be dismissed. A single alert announcement via VoiceOver, countdown updates every 15 s. |
| **HandOffSheet** | Medium detent, grabber. Rota list (name, role, reachable state), backup pre-selected, one "Hand off to <name>" button. Confirm shows who/when afterwards. |
| **IncidentRead** | Pushed page, no editing of severity or status. Header: SEV chip, status marker, owner. Sections: What happened, Linked drives/vehicles, Timeline, Notes. Quick action bar (44 pt): Call, Add note, Open on desktop link. |
| **NoteComposer** | Sheet, medium detent, keyboard up, Send in the nav bar; draft preserved on dismiss; notes appear in the incident timeline with author and time. Notes are the only write besides ack and hand-off. |
| **NotificationCard** | Push payload spec: title "SEV1 · INC-xxxx" (text label, since the glyph can't render), body = title + "Backup in 4:12". Time Sensitive by default; SEV1 critical **[entitlement, section 5]**. Actions: Acknowledge, Open. |

### 2.3 iOS principles

| # | Principle | The decision it forced |
|---|---|---|
| I1 | **One thumb, one decision.** | The takeover has exactly two weighted actions, Acknowledge (primary, bottom, 50 pt) and Hand off. Everything else is a text link. No swipe-only actions. |
| I2 | **Reach beats density.** | Desktop's 36/28 pt rows become 64 pt two-line rows. We trade rows per screen for correct taps; the desktop stays the place for comparison. |
| I3 | **Use the platform, keep the meaning.** | Tab bar, large titles, detents, and swipe-back are native; severity shapes, status bar, and violet flags are Plumb's. SF Pro replaces Geist for text, Geist Mono stays for IDs and timers, so numbers still look like Plumb's numbers. |
| I4 | **A notification is a surface.** | Severity must survive in plain text ("SEV1 ·"), because pushes, lock screens, and watches render no glyph or color. |
| I5 | **An unacknowledged alert cannot be swiped away.** | The cover blocks dismissal until ack; the same rule as desktop Esc, enforced with the platform's own gesture. |
| I6 | **Read is wider than write.** | Incident pages are read-only plus notes. Fixing severity or status on a phone, with one hand, mid-street, invites errors; those stay on desktop. |

---

## 3. In-vehicle co-pilot

Every screen obeys the **glance budget** **[A]**: <= 2 s means at most one headline (<= 4 words), one number or shape, and one target. No lists, no scroll, no pagination, no text input, no menus, no dismiss gestures. One layer on screen at a time. Zones are fixed.

```
 1680 x 720                              safe frame 48
 +-----------------------------------------------------+
 | STATUS STRIP 80: vehicle id (mono)  link  lead name |
 | ALERT BAND 168 (hazard / SEV2-3)  -> SEV1 = full    |
 | ------------------------------------------------   |
 |  [TagKey] [TagKey] [TagKey] [TagKey] [TagKey]  320  |
 |                                                     |
 | TOAST ZONE 120 (bottom, centered)                   |
 +-----------------------------------------------------+
```

**Severity by shape and position:** shape is the Plumb glyph at 48 px beside a 32 px label. Position carries severity independently: (1) SEV1 occupies the whole screen (takeover), SEV2/3 alerts only the top band; the bigger the area, the higher the severity; (2) in the TagPad, keys sit left to right in descending proposed severity, fixed per fleet, never reordered by use; (3) key fill weight: solid / tint / outline. Remove hue and the screen still reads.

### 3.1 Component mapping

| Plumb primitive | Vehicle | Notes |
|---|---|---|
| Severity chip | **Changes (size only)** | Chip 56 high, glyph 48, label 32. `dot` form is banned: shape plus text always. |
| Escalation card | **Changes** to EmergencyCall | Chain reduced to "<name> is being called"; countdown to backup re-route at `2xl`. |
| Map layer | **Changes** | No map. Hazard ahead is a neutral square glyph + a DistanceBar. The map belongs to the display's navigation, not this layer. |
| Empty / error states | **Changes** | Only two: "Offline: tags saved" status in the strip (not blocking, tags queue) and a blocking "Call not connected. Retry" in the call. No skeletons. |
| Status marker, flags | **Dropped** (flags only as text in the call) | Lifecycle is not shown while driving. |
| Data table, filter bar, split pane, timeline, metric tile, coverage bar, command palette | **Dropped** | Lists, scrolling, and search are not glanceable. Voice ("Tag phantom brake") is the parallel input and goes through the same TagPad action. |

New components:

| Component | Anatomy, variants, states |
|---|---|
| **TagPad** | 3 to 5 TagKeys in one row, fixed slots, no paging. Anatomy: status strip, key row, toast zone. States: ready, pressed (key `surface-selected`, instantly), confirmed (toast; keys stay live), offline (strip text + queued marker on toast), locked (during SEV1 call only, keys hidden). Fleet admins configure the tags; a 6th is a build error. |
| **TagKey** | 288 x 320 (480 x 320 at three keys). Top-left: SEV glyph 48 + "SEV1/2/3?" (dashed border = proposed). Center: label <= 2 lines, <= 14 chars per line (e.g. "Phantom brake", "Planner freeze", "Sensor drop"). Fill: SEV1 solid `sev1-mark` w/ `on-sev1` text; SEV2 `sev2-bg` + `sev2-line` border; SEV3 `surface` + `sev3-line` border. 3 px border always. Whole key is the target; fires on press-down release inside; **no double-tap, no long-press, no confirm dialog** (undo lives in the toast). Debounce 600 ms against double-hits. Focus (wheel controller): 4 px ring. |
| **ConfirmToast** | Bottom center, 120 high, `surface-raised` + border. "Logged" + tag label + proposed severity chip + queued flag if offline + **Undo** key (76 min, shows for 4 s). Fade in 120 ms, dwell 3 s, instant out. Single toast; a second tag replaces it. Spoken: "Phantom brake logged". Never covers keys. |
| **GlanceAlert** | Top band, 168 high, full width. Variants: **Hazard ahead** (neutral hazard square glyph, headline <= 3 words e.g. "Debris ahead", DistanceBar with mono `xl` meters, e.g. "420 m"); **SEV2/3 notice** (rare: lead-pushed, chip + 4 words). States: approaching (distance counts down), passed (instantly removed at 0 m), muted (tapped, 76 key "Got it", stays muted for that hazard). Priority: EmergencyCall > hazard > toast; the TagPad stays usable under a band (the band sits in reserved space, so keys never move). Never stack two alerts: newest-nearest wins. |
| **DistanceBar** | Linear 16 px bar showing remaining distance, plus mono number, plus unit in `sm`. Not a gauge. |
| **EmergencyCall** | SEV1 takeover, full screen, `sev1-bg` ground, 12 px `sev1-mark` frame, SEV1 glyph 120 px top-left with "SEV1" label. Left 60%: **GuidedCallStep**. Right 40%: call status ("Calling <lead>" / "Connected" mono timer) and a 160-high **Call backup** key if the lead doesn't answer within the escalation timeout (shows countdown at `2xl`; auto re-routes either way). States: connecting, connected, no answer, re-routed ("Calling <backup role>"), ended (return to TagPad). Cannot be dismissed without ending the call; **End call** is a 76 key kept apart from the step key (>= 100 px away) to avoid mis-hits. |
| **GuidedCallStep** | One step at a time. Anatomy: "2 of 5" (mono, `xl`-size numerals), instruction <= 5 words in `xl` 72 px imperative ("Stop. Hazards on."), one **Done** key (160 high, 480 wide). Voice reads the same text; "Done" can also be spoken; the next step appears instantly. Steps come from the shared post-incident protocol (D-020); wording here is a placeholder pending a safety owner. No back, no skip, no branching. |

### 3.2 Vehicle principles

| # | Principle | The decision it forced |
|---|---|---|
| V1 | **If it takes more than two seconds, it does not belong on this screen.** | A glance budget (1 headline <= 4 words, 1 number, 1 target) replaced a "what do we want to show" list. Tags, the metric tiles, and the timeline were dropped, not shrunk. |
| V2 | **Big and apart.** | 76 px minimum, 288 x 320 keys, >= 24 px between targets, End call kept 100+ px from Done. Gloved, vibrating hands miss small neighbours, so we spend space instead of text. |
| V3 | **Shape and position carry severity; hue only confirms it.** | SEV1 owns the whole screen, SEV2/3 the top band; keys ordered by severity left-to-right and never re-sorted by use; shapes and "SEV1" text on every element. A glance in grayscale or glare still works. |
| V4 | **Night first.** | Default ground is `#0a0b0e` with AAA text. Day is the variant. No shadows, no large white areas. |
| V5 | **The screen stays still.** | No slide, bounce, pulse, or blink; the SEV1 ring pulse from desktop/iOS is removed because it draws the eye. Layout is fixed so muscle memory forms: keys never move. |
| V6 | **Capture never waits for the network.** | A tag fires on release, confirms locally, and queues if offline; the strip says "Offline: tags saved". The lead corrects severity later (ia.md), so the driver never decides it. |
| V7 | **Undo, not "Are you sure?"** | Confirm dialogs cost a glance; an undo key on the toast corrects a mis-tap in 4 s without an extra step before capture. |

---

## 4. Handoff for builders

- `<html data-surface="ios" data-theme="light|dark">`; size the root 393 x 852; draw safe-top/bottom with `pt-safe`/`pb-safe`.
- `<html data-surface="vehicle" data-ambient="night">`; root 1680 x 720, `overflow:hidden`, `safe-frame`.
- Carried components (`SeverityChip`, `StatusMarker`) must read size from tokens (`text-xs`, `h-chip`, `size-icon`) and not hard-code px, so they resize with the surface.
- Do not apply `compact:` or `dark:` variants on vehicle; use `data-ambient`.
- Component names go in `prototype/src/surfaces/ios` and `.../vehicle`; shared fixtures stay in the store.

## 5. Open questions for the human

1. **Interaction while moving.** Should the EmergencyCall steps and any tapping be allowed at speed, or locked to voice-only above a threshold? Affects whether Done keys exist at all. Needs safety owner and platform policy input.
2. **Driver side / handedness.** Which side of the display does the driver sit on in the target markets? TagKey order (SEV1 nearest the driver?) and the End/Done separation follow from this. Currently ordered SEV1 at the left.
3. **Emergency services.** Does the guided call include dialing emergency services, or does the car's native emergency call stay out of this concept? Protocol steps are placeholders (D-020 already open).
4. **iOS critical alerts.** Critical Alerts and Time Sensitive notifications need an Apple entitlement; confirm we design as if granted.
5. **Glance budget numbers** (32 px floor, 76 px, 4 words, 3 s toast) come from your 2-second standard plus my proposals. Confirm against the Drive Coach values; none are research findings.
6. **Operator capture on iOS** remains out (Q6 assumption). Confirm.
