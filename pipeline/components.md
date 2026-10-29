# Plumb: components

Plumb is the Fleet Console's design system. Tokens: `tokens.json`; Tailwind v4 theme: `theme.css`. Tailwind names below (`bg-surface`, `h-row`, `text-sev1-fg`) are real utilities from that file. Fixture data only.

## Principles

| # | Principle | The decision it forced |
|---|---|---|
| 1 | **One scale, one lifecycle, everywhere.** | Severity and status are components, not colors. Their glyph, label, and fill are fixed; no screen styles its own. SEV1-3 and Captured-to-Verified only; Escalated/Overdue/Stale render as flags, never states. This retires v1's two scales. |
| 2 | **Color is meaning, not mood.** | UI is neutral. Red/amber/teal mean severity, violet means a flag, ink blue means interaction. No green anywhere: Healthy and Verified are a neutral or ink check. Red also marks coverage gaps, but only as a hatch. |
| 3 | **Never trust a single channel.** | Severity = label + shape + fill weight + hue (SEV1 solid triangle, SEV2 tinted diamond, SEV3 hollow ring). Remove hue and the levels still read. Gaps are hatched, not just red. |
| 4 | **Numbers are the interface.** | Geist with tabular numerals globally, right-aligned numeric columns, mono for IDs and timestamps, units in subtle text. Metrics use 28/40px weight 600. |
| 5 | **Density is a mode, not a mess.** | Two modes switch via `data-density`: row 36 to 28, control 32 to 26, base text 14 to 13. Same information both ways; targets never under 24px. |
| 6 | **Absence must be drawn.** | Uncovered shifts, empty queues, and stale items each have an explicit visual state. An empty queue is a success message, not a blank, which makes falling oversight debt visible. Every action is also reachable by keyboard with a visible hint. |

## Conventions (all components)

- Focus: 2px `focus` ring, offset 2, always visible. Hover hints show the shortcut (`kbd`, mono, `bg-surface-sunken`).
- Selection = `bg-surface-selected` + 2px `accent` left bar. Hover = `bg-surface-hover`. No motion on either.
- Disabled: `fg-subtle` at 60%, with a tooltip saying why.
- Live data: values update in place; the row never moves under the cursor (new rows queue behind a "3 new" bar).
- Text is never below 11px; chips and column headers are the only 11px.

---

## 1. Data table

The workhorse of Inbox, Review, Fleet, Owned.

- **Anatomy:** sticky header (caps `xs`, `fg-muted`, sort caret) / optional group header (SEV or status, count, collapse) / row (checkbox, severity edge bar, cells) / footer (count, selection summary) / bulk bar / column menu.
- **Columns:** text left; numbers, durations, and counts right, tabular; ID and timestamps mono. Severity chip and status marker are fixed-width columns so they stack in a clean vertical rhythm.
- **Variants:** comfortable (`h-row` 36) and compact (28); grouped; flat; with preview pane (see 5); read-only.
- **States:** default, hover, focused row (ring inside the row), selected, multi-selected, loading (skeleton rows, see 12), new-rows pending bar, error row (inline retry), empty (see 12). Row edge bar: SEV1 4px, SEV2 3px `sevN-mark`, SEV3 none. Overdue/Stale: flag pill in last status cell.
- **Bulk bar:** appears over the footer on 1+ selected: Assign (`a`), Severity (`s`), Merge into incident, Mark reviewed, Dismiss (`d`). Every bulk action raises a 10 s undo toast (elevation 2).
- **Keyboard:** `j/k` or arrows move; `Enter` opens in preview; `Shift+Enter` full page; `x` toggle select; `Shift+j/k` extend selection; `Cmd+A` select all in view; `e/a/s/d/v` act on selection or focused row; `[` `]` collapse/expand group; `/` focus the filter bar; `Esc` clears selection then closes preview. Roving tabindex: the table is one tab stop.
- **Do:** pin the severity and status columns; show the sort and the filter count; let users resize and hide columns and save them in a view.
- **Don't:** use zebra stripes (they fight selection); put actions in a hover-only column; truncate IDs; reorder rows on live updates.

## 2. Severity chip

The only way to display SEV1-3 on any surface.

- **Anatomy:** glyph (12px) + label ("SEV1") + optional response caption in tooltips.
- **Variants:** `solid` SEV1 (`bg-sev1-mark text-on-sev1`, filled triangle); `tint` SEV2 (`bg-sev2-bg text-sev2-fg border-sev2-line`, filled diamond); `outline` SEV3 (`text-sev3-fg border-sev3-line`, ring). Sizes: 22px comfortable, 18px compact; `dot` form (glyph only, with `aria-label="SEV2"`) allowed on maps and dense timelines only. Proposed vs confirmed: a proposed severity (auto from a tag type) shows a dashed border and "SEV2?"; the lead's confirm removes it.
- **States:** default, hover (tooltip: meaning + response), focus (when editable: opens the picker), disabled/read-only.
- **Keyboard:** when editable, `s` then `1/2/3`; picker is a listbox with arrow keys and `Enter`; `Esc` cancels.
- **Do:** always include the text; use the same chip for tags, incidents, damage, data health, and footage findings; pair with the edge bar in tables.
- **Don't:** recolor, add a fourth level, show a numeric score, or use sev colors for decoration. Never show hue alone, such as a red dot with no label.

## 3. Status marker and flags

One lifecycle for Incident, Damage/repair, Footage review.

- **Anatomy:** 5-segment bar (5x3px, 1px gaps, N filled = step index) + label. Verified shows a check and fills `status-done`. Flag pill (`flag-bg`, `flag-line`, glyph + text) follows the label.
- **Variants:** inline (table), block (page header, with a stepper showing who/when each step happened), compact (bar only, with a tooltip, in timelines).
- **Flags:** Escalated (arrow-up-bar), Overdue (clock, with "2d" age), Stale (dashed hourglass). A row may carry several. Flags never replace the status.
- **States:** default, hover tooltip (who/when), editable (menu of the legal next step only).
- **Keyboard:** `Enter` on the marker opens the next-step menu; `v` verifies (disabled with a reason when the resolver is the same person).
- **Do:** allow only forward moves plus an explicit "reopen" with a reason; show who moved it.
- **Don't:** invent a sixth state (e.g. "Blocked"; use a note); color the bar with severity hues.

## 4. Filter bar and saved views

- **Anatomy:** search input (`/`) / filter tokens (field, operator, value, `x`) / "Add filter" / sort / group / density toggle / saved-view tabs (pinned under the nav) / result count (`aria-live=polite`).
- **Variants:** simple (search + 3 quick filters: Mine/Team, SEV, Status) for beginners; advanced (token query, e.g. `sev:1,2 owner:none shift:night`) for power users; one input, the same parser.
- **States:** default, typing (suggestions by field, then value), active filters, view modified (dot + "Save"/"Revert"), invalid token (inline message), loading (count shows `...`).
- **Keyboard:** `/` focus; `Tab` accepts a suggestion; `Backspace` on an empty input removes the last token; `Cmd+S` save view; `Cmd+Shift+S` save as; `1-9` jump to the pinned view when focus is on the nav; `Esc` blurs.
- **Do:** show the count before and after applying; keep views shareable by URL; name the filters in plain words.
- **Don't:** hide active filters in a closed popover; auto-save over a shared view.

## 5. Split-pane detail

Inbox and Review: list left, preview right.

- **Anatomy:** list pane (a table) / draggable divider (8px target, 1px visual) / detail pane (header with severity, status, owner / actions row / sections / footer shortcuts) / "open full page" link.
- **Variants:** side-by-side (default, `list minmax(360px,1fr)`, `detail minmax(420px,0.8fr)`); stacked (below 1280px); detail collapsed. Detail follows focus, not just selection, after 120ms of dwell; no motion on swap.
- **States:** nothing selected (hint + top item to triage next), loading (skeleton header, real chrome), multi-select (summary + bulk actions), deleted/merged (banner with link), error.
- **Keyboard:** `Enter` moves focus into detail; `Esc` returns to the list at the same row; `\` toggles the pane; `Alt+Left/Right` resize in 16px steps; `g` then `i` jumps back to Inbox.
- **Do:** keep actions at the top of the detail, bound to the same keys as in the list; keep scroll position per item.
- **Don't:** open a modal for a preview; lose list focus when the detail loads.

## 6. Timeline

Incident tags/events, drive history, audit trail, handover.

- **Anatomy:** time rail (mono, relative + absolute on hover) / event node (severity glyph for tags and incidents; neutral dot for notes and status changes) / event card (actor, verb, object, detail) / day separators / "now" marker / gap spans.
- **Variants:** vertical feed (Incident page); horizontal drive strip (tags at positions along the drive, with ODD segment bands); compact (one line per event).
- **States:** default, hover (highlights the linked map point), focused, expanded (telemetry or clip), loading (skeleton nodes), live (new event slides in at the top with a 240ms highlight), empty ("No events yet").
- **Keyboard:** `j/k` between events; `Enter` expand; `m` reveal on the map; `[` / `]` previous/next day; `Home/End` first/last.
- **Do:** use the severity chip form `dot` for tags; show the status change as a node with the status marker; show who and when for every step.
- **Don't:** collapse severity changes into the previous event; rely on color to separate actors.

## 7. Map layer

Hazard route map on Fleet and Incident, drive position.

- **Anatomy:** basemap (muted, neutral; dark and light variants) / route line (`fg-subtle`, 2px) / markers / cluster / legend / layer panel / scale / selection card.
- **Layers:** Tags and incidents (severity shapes: triangle, diamond, ring, matching the chip); Hazards (neutral square marker with Active/Mitigated/Stale in label and outline: solid, dotted, faded); Vehicles (arrow with fixture id); Heat (single ink ramp, never severity hues).
- **Variants:** inline mini-map (Incident), full-screen (Fleet), time-scrubbed (replay a drive).
- **States:** default, hover (label), selected (2px `focus` ring + card), cluster (count, highest severity shape on top), layer off, tiles loading (grid skeleton, markers still render), error (static route list fallback).
- **Keyboard:** map is focusable; arrows pan, `+/-` zoom; `Tab` cycles markers by severity then time; `Enter` selects; `l` opens the layer panel; `Esc` deselects. Every marker has a list-equivalent in the table (accessible alternative).
- **Do:** draw shapes at 14px minimum; keep SEV1 on top in clusters; give the legend the same chips.
- **Don't:** use a color-only legend; animate pulsing markers (the only pulse is the SEV1 ring on an unacknowledged escalation, which stops under reduced motion).

## 8. Metric tile

Now: Oversight debt (unreviewed footage, open incidents, stale escalations), data health, ODD.

- **Anatomy:** label (caps `xs`) / value (`text-xl`, or `text-2xl` for hero) + unit (`sm`, subtle) / delta vs. last shift (arrow + number + words) / sparkline or target bar / optional severity chip / footer link ("12 items").
- **Variants:** count (debt); ratio vs. target (ODD: "62 / 80 h", bar with a target tick; no severity hues); health (Healthy/Degraded/Failing = neutral check / SEV3 / SEV2 chip); hero (debt total).
- **States:** default, hover (shows definition + formula), focus, loading (value skeleton keeps width), stale (flag "Stale 14 m"), zero (value plus "Clear", ink check), error ("Can't compute", retry).
- **Keyboard:** tile is a link: `Enter` opens the filtered queue behind the number; `?` on focus shows the definition. Number and the queue it opens must match (the count always links to the exact view).
- **Do:** make the number and filtered list reconcile; show the delta in words and an arrow, not only color.
- **Don't:** show a gauge or donut; add a composite "health score" the lead cannot reproduce by counting.

## 9. Coverage bar

Now, Plan: shows which shifts and operators are covered over time.

- **Anatomy:** 24h axis (mono ticks) / one lane per shift (Planned, Active, Closed, Uncovered) / covering lead + on-call backup segments / "now" line / rota overlay / legend.
- **Segments:** covered = `accent-subtle` with an ink top edge and the lead's initials; backup only = same, dashed edge; **uncovered = `hatch-gap`** plus the text "Uncovered 02:00-06:00"; closed = `surface-sunken`.
- **Variants:** day (default), week (rows = shifts), per-operator load (counts of open items).
- **States:** default, hover (names, span count), focus, selected, live (the "now" line ticks per minute), loading, error.
- **Keyboard:** arrows move between segments; `Enter` opens the shift; `a` assign cover (opens the rota editor); `t` jump to now.
- **Do:** state gaps in text with durations; show span per lead next to the name; surface the gap on Now with a link to fix it.
- **Don't:** show a gap as an empty bar; hide the backup behind a hover.

## 10. Escalation card

Now, Escalation takeover, iOS reuses it. Answers "never depend on one person".

- **Anatomy:** header (SEV1 chip, incident title, fixture vehicle id) / chain (Raised by, Current owner, Backup from rota, each with role + reachable state) / countdown (`text-2xl` mm:ss to backup re-route, plus a progress bar) / primary actions (**Acknowledge**, **Hand off**) / secondary (Call operator, Open incident) / history.
- **Variants:** full (takeover screen); compact row (Now list: chip, title, countdown, 2 buttons); read-only (viewing someone else's).
- **States (escalation lifecycle):** Raised (countdown running; ring on SEV1 glyph), Acknowledged (countdown stops; shows who and when), Handled (check; collapsed), Timed out (flag Escalated + "Re-routed to <backup role>" in the chain; countdown replaced by the new owner's countdown), loading, error ("Not delivered", retry; states which channel).
- **Keyboard:** `Enter` or `a` acknowledge; `h` hand off (opens the rota picker, pre-selects the backup); `c` call; `o` open incident; `Esc` never dismisses an unacknowledged card.
- **Do:** make the countdown legible at 3 m (40px, mono); show who is next and when; announce with `role="alert"` once, not per tick (update `aria-live` every 15 s).
- **Don't:** show only the current owner; allow a silent dismiss; use motion other than the SEV1 ring.

## 11. Command palette

`Cmd-K` anywhere.

- **Anatomy:** scrim / panel (elevation 3, 640px) / input / scope chips (All, Vehicles, Drives, Incidents, Operators, Actions) / result groups (Recent, Objects, Actions on selection) / result row (icon, title, meta, shortcut) / footer hints.
- **Variants:** global; contextual ("Actions on 3 selected incidents" appears first when a selection exists); argument step (pick owner, then run).
- **States:** empty (recent + suggestions), typing (fuzzy by id, name, alias, `sev1`), no results ("No match; try `g` shortcuts"), loading (inline spinner, existing results stay), error.
- **Keyboard:** `Cmd-K` open/close; arrows or `Ctrl-n/p` move; `Enter` run; `Cmd-Enter` run in a new view; `Tab` scope; `>` actions only; `#` incident id; `@` operator/lead; `Esc` closes and restores focus.
- **Do:** show the shortcut next to every action, so the palette teaches the keyboard; rank by recency then match.
- **Don't:** offer destructive actions without a confirm step; mix results from other scopes below the fold.

## 12. Empty, loading, and error states

- **Anatomy:** glyph (neutral, 24px) / title (`md`) / one sentence of next step / primary action / secondary link / shortcut hint.
- **Empty:** *success* (Inbox zero: "Nothing to triage. Last cleared 14:02." with the debt trend); *first-use* (explains the object and offers one action); *no-results* (names the active filters, "Clear filters" `Esc`); *no-permission* (says who can grant).
- **Loading:** skeletons that keep the final layout and widths (no layout shift); a 150ms delay before they appear; indeterminate bar for >2 s; the real chrome (header, filter bar) always rendered. Never a full-screen spinner.
- **Error:** inline first (row, tile), then pane, then page. Says what failed, what still works, and what to do ("Telemetry feed lost 14:06. Showing data as of 14:05. Retry `r`"). `role="alert"` only for blocking errors. Includes a reference id in mono.
- **States:** default, retrying (button shows progress), recovered (single toast).
- **Keyboard:** primary action is the first tab stop in the region; `r` retries; `Esc` clears filters on no-results.
- **Do:** treat an empty queue as the goal state; keep error copy in the system's voice, plain and exact.
- **Don't:** use illustrations or cheerful copy in safety contexts; blank a pane on error; show a spinner without a label.

## Vocabulary

Source of truth: `prototype/src/lib/copy.ts` (COPY). Desktop applied; iOS and vehicle adopt next.

```
GLOSSARY (canonical terms; every surface imports COPY, none types these words).

Oversight debt = the plain sum of four queues:
  Footage     "Footage to review": recorded drive segments nobody has reviewed yet.
  To triage   Incidents still Captured or Triaged (nobody owns them). Never "Open incidents".
  Re-routed   Escalations nobody answered in time, so they moved to the next lead. Never "Stale escalations".
  Gaps        "Coverage gaps": shift windows with no primary lead.

Escalation states, in order:
  Paged -> Timed out -> Re-routed -> Acknowledged -> Handled
  Paged         the current lead has been alerted and the clock is running.
  Timed out     that lead did not answer in time (about the person, past tense).
  Re-routed     it moved to the next lead on the rota (about the escalation).
  Acknowledged  someone took it. They own it now.
  Handled       all five protocol steps done. Closed.
  Clock:        "mm:ss left" (it then re-routes). Never "moves on" or "expires". None left: "Nobody is left to page."

Rota roles:
  Primary  the lead on point for a shift window.
  Backup   the next lead paged if the primary does not answer.
  Escalation owner = whoever holds the escalation right now. Never "Held by" or "Calling".
  Incident owner   = whoever owns the incident. A different person; always say which.

Lifecycle (incident):  Captured -> Triaged -> Owned -> Resolved -> Verified.
Flags (additive, violet): Escalated (has an escalation), Overdue (past its due time), Stale (no update for 72 h; incidents only).

IDs: pair rule is ESC id in the title, INC id in the meta line.
```
