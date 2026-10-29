# Critique 03: surfaces (iOS and in-vehicle)

Reviewed: all `ios-*.png` (24), all `vehicle-*.png` (11), and `escalation-acked-light.png` against `surfaces.md` and `decisions.md` (D-025 to D-031). Known OPEN gaps (no Call-backup key, no chime or offline state, simulated call timer, no swipe-ack, no mini-map, no Inbox search, no gesture block, Dynamic Type untested, 5th protocol step, entitlement) are not re-reported.

Pixel sizes are estimates from the screenshots (the vehicle frame is about 1.105 px per CSS px). Verify them with a DOM measure before quoting them.

Verdict: the iOS build feels native and the vehicle TagPad is calm and well spaced. The weak points are the vehicle emergency screen, a few copy and logic contradictions on iOS, and vocabulary drift between surfaces.

## Ranked findings

### 1. 🔴 vehicle: the guided step asks a question that Done cannot answer
- Screens: `vehicle-emergency-calling.png`, `vehicle-emergency-connected.png`.
- Step 1 reads "Are you safe?" and step 3 reads "Need emergency services?", and both have a single "Done" key. Done is not an answer to a question. In step 3, tapping it could mean "yes, calling" or "none needed".
- `surfaces.md` says steps are imperatives of at most 5 words ("Stop. Hazards on."). The shipped copy breaks its own rule.
- Fix, step 1: change the copy to an imperative, for example "Stop. Hazards on." or "Say your name." Done then means "I did it".
- Fix, step 3: replace the single Done key with two 160-high keys, "Yes, call 112" and "Not needed", at least 100 px apart. That is the only step with two targets, and the spec should state the exception.
- Also pick the voice grammar, because "done" cannot be the spoken answer to a yes/no question.

### 2. 🔴 vehicle: the right column of the emergency screen blows the 2-second budget
- Screens: all three `vehicle-emergency-*` states.
- The right column holds 2 mono IDs ("INC-4139 · FV-0101"), "Calling", a name, a 12-word sentence over two lines ("Re-routed · no answer from Marisol Quintanilla-Veyrat de la Cruz"), and "Backup on the rota". That is about 17 words in 5 text sizes, and the long name is the longest thing on the screen.
- A driver needs "who is on the line" and nothing else. The budget is one headline of at most 4 words, one number, one target.
- Fix, calling state: show "Calling" and "Devika" (first name only) and nothing else. Voice carries the reroute story ("Marisol didn't answer. Calling Devika.").
- Fix, IDs: drop INC and FV from the car. If provenance matters, show only "INC-4139" at floor size in the status corner.
- Fix, calling-state number: show the backup countdown in `2xl` mono, because that is the one number the spec reserves for this state.

### 3. 🔴 vehicle: the timer reads 00:00 and the done state has two exits
- Screens: `vehicle-emergency-connected.png`, `vehicle-emergency-done.png`.
- "Connected" shows `00:00` in 120 px and it never moves in the stills. In `done` it is still 00:00 beside "Connected". A frozen hero number reads as broken and takes the strongest weight on the screen.
- `done` also offers "Back to tags" (primary, 160 high) and "End call" at the same time. The spec says the call cannot be dismissed without ending it, so "Back to tags" is ambiguous: does it hang up?
- Fix, timer: the call timer counts up from connect, small and `xl`, not `hero`. Reserve 120 px for the pre-connect backup countdown only.
- Fix, done state: one key, "End call" (primary). Remove "Back to tags", which becomes automatic on hang-up.

### 4. 🟠 ios: acknowledged takeover tells you someone else holds it
- Screen: `ios-takeover-acked-light.png` and `ios-takeover-acked-scrolled-*`.
- The grey notice says "Held by Devika Raman. You can read it here; only the paged lead can acknowledge." Devika Raman is the signed-in user, who has just acknowledged. It is the non-owner copy shown to the owner.
- The un-acked screen also says "This screen closes once you acknowledge", yet the acked screen is the same page with a back button, so the promise is false.
- The desktop equivalent (`escalation-acked-light.png`) says "Acknowledged by Devika Raman 15:41" and "(you)". iOS should match.
- Fix: hide the "Held by" card when `isMine`. Show only the existing "Acknowledged 15:41. Countdown stopped." line and "(you)".
- Fix, copy: change the banner to "You can't leave until you acknowledge" and drop the "closes" claim.
- Bottom-bar issue: the sticky bar in the acked state is a disabled "Resolve escalation" plus a two-line hint plus Hand off, about 40 percent of the viewport. The protocol, which is the actual work after ack, sits below the fold.
- Fix, bar: make Resolve a compact trailing button, or collapse the hint to "3 steps left", and let the protocol list lead the page.

### 5. 🟠 ios: dev and demo scaffolding leaks into product screens
- Screens: `ios-escalations-empty-*`, `ios-me-*`, `ios-lock-*`.
- "Preview the lock-screen alert" is a link on the empty Escalations state and a row on Me.
- "Assumes the Critical Alerts entitlement is granted for this safety program" and "Last seen now. Plumb prototype, fixture data." are design notes inside the UI.
- The lock screen caption "Plain-text severity survives on lock screens, watches and pushes." is an annotation, and "Critical Alert. Sounds even on silent." inside the card is not something iOS renders.
- A hiring manager reads these as an unfinished mock. The empty state also shows the tab badge **1** while the body says "Nothing waiting on you". The badge contradicts the state, which makes the empty-state shot look fake.
- Fix: move the previews and the assumption note to `?demo` or Gallery, and keep captions outside the phone frame.
- Fix, badge: in `?empty=1`, clear the badge. In a real build, drive both from the same count.

### 6. 🟠 ios: acknowledging from the app costs two taps behind a button called "Review"
- Screen: `ios-escalations-light.png`.
- Job counts today:
  - Acknowledge from the lock screen: 1 action. Good.
  - Acknowledge from the app: Review, then Acknowledge, 2 taps.
  - Hand off: Review, Hand off, confirm, 3 taps, because the backup is preselected.
  - Read an incident: 2 taps.
- On a SEV1 with 01:40 left, "Review" is a filled primary that does not do the urgent thing. The takeover puts Acknowledge at the bottom, but the card does not.
- Fix: on the "Needs you now" card, make Acknowledge the filled primary and show Review as a secondary text link next to the chevron. Add the haptic from the spec. This brings acknowledge-in-app to 1 tap.
- Also: "TIMES OUT, THEN" in the takeover is a dangling label, and "RE-ROUTES IN" on the other-person page is a different phrasing. Use one label, "Time left", with the consequence beneath.

### 7. 🟠 cross-surface: the same escalation is named differently on each surface
- See the table in the cross-surface section below. The marks and the IDs match, but the verbs do not.
- Concrete drift:
  - Desktop Now says "To triage" (D-024). iOS `ios-now-*` still says "Open incidents".
  - The same object is "Timed out" (desktop chain), "Escalated" flag (iOS card), "Stale escalations" (iOS Now tile), and "Re-routed" (car and iOS body). The lock screen says "01:40 left before it moves on", while the card says "nobody is left to page".
  - Desktop labels people as "Escalation owner / Backup". iOS says "Held by". The car says "Calling".
  - Desktop shows ESC-0206 plus INC-4139. iOS list and car show INC only. iOS takeover shows ESC in the nav title.
- Fix: pick one noun for each state and one pair rule (ESC id in the title, INC id in the meta line, on every surface). Apply this to the iOS Now tile, the lock-screen body, and the car's single status word.

### 8. 🟠 vehicle: text and targets sit at or below the floor, with no headroom
- The 32 px floor, by smallest text per state (estimates):
  - `vehicle-drive-night`: hint "Say 'Tag phantom brake'" about 32, "km/h" about 33. At the floor.
  - `vehicle-hazard-night`: the "m" unit after 420 looks about 26. Below the floor.
  - `vehicle-toast-night`: "15:42" and the chip label about 32. At the floor.
  - `vehicle-emergency-*`: "Say 'done'" about 28, and "logged 15:42" and the done-state "15:42" about 27 mono. Below the floor.
  - Right-column "Re-routed…" about 36. OK, but see finding 2.
- Targets:
  - TagKey 288 x 320 matches the spec.
  - Done 488 x 172 matches the spec.
  - End call, "Got it", and Undo are about 75 to 77 high. They are at the minimum with no margin.
  - Key gap about 25. OK.
  - Band-to-key gap about 26. OK.
  - End call to Done are more than 100 px apart. Good.
- Fix: bring the unit "m", "Say 'done'", and the log timestamp to 32 or remove them (the timestamp is not a glance item). Raise End call, Got it, and Undo to 88 to 96 high.

### 9. 🟠 vehicle: the TagPad shows one fact five times, and a neutral square means two things
- Screens: `vehicle-drive-*`, `vehicle-toast-*`, `vehicle-hazard-*`.
- Four of five keys are identical amber with a dashed "SEV2?" chip. Position cannot carry severity when every key reads the same. The driver cannot tell keys apart except by reading 1-2 words, which is a scan across five targets, not a glance.
- The dashed border and "?" mean "lead decides later" (V6). The driver never decides severity, so that message is noise in the car.
- The white square used for "Autonomy on" is the same neutral square glyph as the hazard marker ("Debris in right lane"). Hazard is a neutral square by spec, so the status strip is reusing it.
- The toast is "Phantom brake · tagged · 15:42" plus chip plus Undo: 5 words, 2 numbers, 1 chip and 1 target. The spec says "Logged" plus label.
- Fix:
  - Reduce a key to glyph + solid "SEV2" label. State once on the strip or in the spec that tags are proposed.
  - Replace the autonomy square with a text-only state, or a distinct glyph that is not a neutral square.
  - Cut the toast to "Logged · Phantom brake" and Undo, with no timestamp and no chip.
  - Consider ordering keys so that severity is not tied for 4 of 5 (D-030 notes the tie), or leave the order and accept that position carries nothing here.

### 10. 🟠 ios: incident read has craft slips that look unconsidered
- Screen: `ios-incident-light.png`, `ios-note-composer-light.png`.
- The bottom action bar's "Add note" button wraps to two lines ("Add / note") inside a 50 pt button next to "Call" and "Desktop". Fix: label it "Note", or give it a larger share of the bar.
- The timeline shows "System No acknowledgement in 05:00. Re-routed to LD-04 (next on rota)." There are two defects:
  - A raw staff ID, `LD-04`, appears where desktop shows a name.
  - The actor "System" is run into the sentence with no separation.
  - Fix: use the person's name and set the actor on its own line or in semibold.
- "Incident owner: Unassigned" sits above an escalation Devika holds. The term collides with "Held by". Name it "Incident owner" and "Escalation holder" consistently.
- The "Vehicles and drives" rows use an odd flat vehicle glyph. Use the same car icon as the desktop nav.
- The note composer shot shows a half-empty white sheet with no keyboard, which is unconvincing. Capture it with the keyboard up.

### 11. 🟡 ios: list rows truncate and do not align
- Screens: `ios-inbox-light.png`, `ios-escalations-light.png` (Other active).
- Titles end in "followi…" and "stop on merge;…" although the spec says severity and status text wrap and never truncate.
- The title column starts at different x positions because "SEV1" and "SEV1?" chips have different widths (about 12 px shift). Fix: a fixed-width chip column, or put the chip above the title.
- Row line structure alternates:
  - Triaged rows have a status line then "Unassigned · 3 tags".
  - Untriaged rows have "Untriaged tag · FV · age" then "Unassigned".
  - Rows are about 95 pt, not the 64 pt spec.
- Fix: one fixed 3-line template (title, meta with id and age, owner), 2-line wrap on titles, and one chevron per row. The Inbox rows have no chevron although they read as tappable and are read-only. Say so with the subtitle only, or add the chevron.

### 12. 🟡 ios: hand-off sheet defaults and contrast
- Screen: `ios-handoff-sheet-light.png`.
- Priyanka Vandersloot is pre-selected, but she already holds ESC-0207 (Other active, 04:12 left). Handing a second SEV1 to someone with one running is the failure the product exists to prevent.
- The spec says the backup is pre-selected, which would be Gideon Abara. Pre-select the first reachable person with the least active load, and show "Holds 1 active" on the row.
- The greyed rows (Marisol, Tobias, Hana) have name text about 2.4:1, below AA for text, and Marisol's name truncates ("…de la C…"). Disabled rows still carry the reason ("Unreachable"), so use the secondary text colour, not a lighter name.
- The sheet's medium detent covers the countdown, so the person choosing cannot see the time left. Keep a one-line timer in the sheet header.

## Two-second glance audit, per vehicle state

Budget: one headline of at most 4 words, one number, one target; no scanning. Pass means it fits.

| State (screen) | Headline words | Numbers and text elements | Targets | Smallest text | Needs scanning? | Result |
|---|---|---|---|---|---|---|
| Drive, ready (`vehicle-drive-night`) | 4 (hint) | speed, drive id, 5 key labels | 5 keys, 288 x 320 | about 32 | Yes, 5 keys with 1-2 word labels; mitigated by voice hint | Pass with note (finding 9) |
| Toast (`vehicle-toast-night`) | 5 words, 2 numbers, chip | "15:42", chip, label | Undo plus 5 keys | about 32 | Toast must be read, then keys | Over budget (finding 9) |
| Hazard (`vehicle-hazard-night`) | 4 ("Debris in right lane") | 420 m, a full bar, a glyph | Got it plus 5 keys | about 26, the "m" | Bar adds nothing the number says | Pass on words; unit below floor |
| Emergency, calling | 3 ("Are you safe?") but right column about 17 words | 2 IDs, "1 of 4", a name | Done and End call | about 36 | Yes, two columns of text | Fail (findings 1, 2) |
| Emergency, connected | 3 ("Need emergency services?") | 00:00, "3 of 4", logged time | Done, End call | about 27 | Yes | Fail (findings 1, 3) |
| Emergency, done | 2 ("Steps logged.") | 00:00, 15:42 | Back to tags, End call | about 27 | Mild | Fail (finding 3) |
| Day variants | same as night | same | same | same | same | Same results; day SEV1 ground reads well |

Also: the step counter "1 of 4" is mono at the same 72 px as the instruction, so it competes with it. Make it `glance-sm` (32).

Night and day are otherwise strong: no shadows, no motion, 3 px borders, keys that do not move.

## iOS: native or shrunken desktop?

- Native: large titles, inset-grouped cards, a 4-icon tab bar with number badge, medium-detent sheets with grabber, Cancel and Send in the sheet header, segmented Mine/Team, a lock-screen card with two actions. The bottom-anchored Acknowledge and Hand off pair is the right shape for one thumb.
- Still desktop-shaped: the Now screen (debt hero plus 2x2 tiles plus a 24h coverage chart with three quarters empty, and the gap alert clipped under the tab bar), the Inbox row anatomy (status segments and metadata at row scale), and key-value tables (Where, Vehicle, Note) in the takeover and incident read.
- The tab bar has 4 tabs (Escalations, Now, Inbox, Me) but `surfaces.md` section 2.1 says 3 with "Incidents". D-031 did not record the change. Update the spec or the build.
- The Inbox says "Read-only here; triage on desktop". Honest, but a read-only tab with no chevrons has weak value. Q6 (lead-first, no triage on iOS) is an assumption; keep the tab only if the lead needs it.

## Cross-surface: does one escalation read as one object?

Compared: `escalation-acked-light.png` (desktop), `ios-takeover-light.png`, `ios-takeover-acked-light.png`, `ios-escalations-light.png`, `vehicle-emergency-*`, `ios-lock-dark.png`.

| Aspect | Desktop | iOS | Vehicle | Match? |
|---|---|---|---|---|
| Severity mark | red solid triangle, "SEV1" | same | salmon solid triangle (night), red (day), "SEV1" | Yes |
| Violet flag | banner shows "Timed out" on the owner | "Escalated" flag on card and takeover | none (text) | Partly: word differs |
| Incident ID | INC-4139 | INC-4139 | INC-4139 | Yes |
| Escalation ID | ESC-0206 | ESC-0206 (takeover title only) | none | Partly |
| Vehicle, drive | FV-0101, DR-9501 | FV-0101, DR-9501 | FV-0101, DR-9501 | Yes |
| Who holds it | "Backup Devika Raman (you)", "Acknowledged" | "Held by Devika Raman" (wrong for you, finding 4) | "Calling Devika Raman" | No |
| Protocol | 5 steps, "Confirm the operator is safe" | 5 steps | 4 steps, "Are you safe?" | Partly (known gap), wording differs |
| Time left | 04:12 mono | 01:40 mono | 00:00 mono | Format yes; value contradicts (car is simulated) |
| Reroute story | Marisol "Timed out 3m ago" | "did not answer in 5 min" | "no answer from Marisol Quintanilla-Veyrat de la Cruz" | Same facts, three phrasings |

Fixes are in finding 7. The shape language and mono timers do carry across. The weakness is words and the pairing of IDs.

## Hero shots

- Vehicle: `vehicle-hazard-night.png`. It shows the layered idea in one frame (hazard band above, keys unmoved, night ground). Use `vehicle-drive-night.png` as the calm companion. Fix findings 8 and 9 (the "m" unit and the neutral square) before publishing. Do not use any `vehicle-emergency-*` shot until findings 1 to 3 are fixed.
- iOS: `ios-takeover-light.png` (one decision, severity, countdown, Acknowledge anchored at the bottom). Runner-up: `ios-lock-dark.png` once the annotation caption and the invented "Critical Alert" line sit outside the card.
- Desktop reference: `escalation-acked-light.png`. It is the baseline for the pair story.
