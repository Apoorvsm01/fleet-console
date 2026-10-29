# Lint: stage 5a, round 1

Mechanical checks only. Scope: `prototype/src/` (screens, components, lib, theme.css, index.css). Contrast math was not redone; it is in `00-contrast.md`. Token source: `pipeline/tokens.json`. Live theme: `prototype/src/theme.css`.

**Owner routing.** `now` = NowScreen, screens/now/*, CoverageBar, MetricTile. `inbox` = InboxScreen, screens/inbox/*, DataTable, FilterBar, SplitPane. `incident` = IncidentScreen, screens/incident/*, Timeline, RouteMap. `escalation` = EscalationScreen, EscalationCard. `foundation` = theme.css, index.css, tokens.json, AppShell, CommandPalette, Icon, ui, states, SeverityChip, StatusMarker, Gallery. `unrouted` = no builder among the five.

**Rule codes.** COLOR = color or alpha bypass. SIZE = px or size literal. SPACE = density-invariant spacing. TYPE = type scale, tracking, weight. RADIUS = radius. SEV-HUE = sev* token outside severity, gap, or error. LABEL = severity, status, or state label drift. ICON = glyph spec mismatch. FOCUS = focus style missing. ARIA = label, landmark, or heading. TARGET = interactive target under 24px. STATE = empty, loading, or error state missing. MIRROR = theme.css drifts from tokens.json.

| file:line | rule | problem | fix | owner |
|---|---|---|---|---|
| prototype/src/theme.css:19 | MIRROR | `--font-sans` leads with "Geist Sans"; tokens.json says "Geist" | Align to tokens.json family string | foundation |
| prototype/src/theme.css:150-162, 236-251 | MIRROR | Prototype-only tokens (chip, icon, nav, palette, edge, seg, hit) are not in pipeline/theme.css; D-017 still OPEN | Fold into tokens.json, then pipeline/theme.css, then re-mirror | foundation |
| prototype/src/theme.css:82, 197 | MIRROR | `--color-scrim` (light and dark) has no tokens.json entry | Add scrim to tokens.json | foundation |
| prototype/src/theme.css:290 | COLOR | `hatch-gap` pattern is not in tokens.json, so text drawn on it (CoverageBar.tsx:76) is unverified | Define hatch-gap in tokens.json and add a contrast pair | foundation |
| prototype/src/index.css:27 | SIZE | Ring pulse duration `1.6s` is a literal, not a motion token | Add a motion token | foundation |
| prototype/src/components/AppShell.tsx:52 | SIZE | Shift switcher `h-8` ignores compact density (should be `h-ctl`, 32 to 26) | Use `h-ctl` | foundation |
| prototype/src/components/AppShell.tsx:68 | SPACE | Nav `gap-4` (16px) ignores compact density | Use `gap-gap` | foundation |
| prototype/src/components/AppShell.tsx:75 | SIZE | Selection bar `shadow-[inset_2px_0_0_...]` uses a literal 2px | Token for the 2px selection bar | foundation |
| prototype/src/components/AppShell.tsx:103, 106 | SIZE | Top bar `h-12` and search trigger `w-64` have no token | Layout tokens | foundation |
| prototype/src/components/AppShell.tsx:23 | ARIA | Region label "Active escalations" duplicates the section label at NowScreen.tsx:39 | Unique landmark names | foundation |
| prototype/src/components/AppShell.tsx:79 | ARIA | `aria-label` on a bare span (generic role; AT ignores it) | Put the label on a role or use sr-only text | foundation |
| prototype/src/components/AppShell.tsx:159 | FOCUS | `outline-none` on the skip-link target `<main tabIndex=-1>` with no replacement | Keep a visible focus style | foundation |
| prototype/src/components/CommandPalette.tsx:104 | FOCUS | Search input has `outline-none`; wrapper (line 100) has no focus-within ring, so no visible focus | Add focus-within ring to the wrapper | foundation |
| prototype/src/components/Icon.tsx:19, 42 | ICON | Stale flag uses `hourglass` with dashing disabled (`strokeDasharray='0'`); spec is hourglass-dashed | Add a dashed hourglass glyph | foundation |
| prototype/src/components/StatusMarker.tsx:6 | ICON | `FLAG_ICON.Stale` = `hourglass`, not `hourglass-dashed` | Follow Icon.tsx fix | foundation |
| prototype/src/components/StatusMarker.tsx:68 | COLOR | `opacity-60` on future-step labels: text color via opacity, not tokenised, not contrast-checked | Use a token color for future steps | foundation |
| prototype/src/components/StatusMarker.tsx:69 | SIZE | Block-variant stepper segments `w-12` (48px) vs spec segment 5x3 | Token for the stepper segment, or document it | foundation |
| prototype/src/components/SeverityChip.tsx:6-8 | LABEL | `response` captions differ from tokens.json `severity.levels.*.response` ("Immediate; auto-escalates", "Same shift; owner required", "Batch review") | Use tokens.json text | foundation |
| prototype/src/components/SeverityChip.tsx:58 | SIZE | Severity dot `size-3.5` (14px); spec glyph is 12px (`SeverityGlyph` uses size-3 at line 19) | Use the 12px glyph size | foundation |
| prototype/src/components/ui.tsx:26 | COLOR | Disabled state is `opacity-60` on the whole control; spec is `fg-subtle` at 60% | Token color for disabled | foundation |
| prototype/src/screens/Gallery.tsx:39 | SPACE | `gap-4` ignores density | Use `gap-gap` | foundation |
| prototype/src/screens/Gallery.tsx:67 | SIZE | `h-96` (384px) literal | Token or flex sizing | foundation |
| prototype/src/screens/InboxScreen.tsx:34 | COLOR | `opacity-80` on the count inside the segmented control: text alpha, not tokenised, not contrast-checked | Token color for the count | inbox |
| prototype/src/screens/InboxScreen.tsx:21 | LABEL | Owner filter says "Unowned"; Preview.tsx:57 says "Unassigned"; IncidentScreen.tsx:169 says "No owner" | One term across screens | inbox |
| prototype/src/screens/InboxScreen.tsx:99 | LABEL | Owner cell shows "Unowned" (same drift as line 21) | One term across screens | inbox |
| prototype/src/screens/InboxScreen.tsx:116 | ARIA | Page has no h1 (PaneHeader is h2 only) | Add an h1 | inbox |
| prototype/src/screens/InboxScreen.tsx:125 | STATE | `loading` and `error` are never passed to DataTable (DataTable.tsx:199-200 supports both) | Wire loading and error | inbox |
| prototype/src/components/DataTable.tsx:201 | STATE | Body renders blank when `empty` is omitted | Default to an EmptyState | inbox |
| prototype/src/components/DataTable.tsx:181, 225 | SPACE | Checkbox column `pl-4` (16px) ignores compact density | Use `pl-pad` | inbox |
| prototype/src/components/DataTable.tsx:182, 226 | TARGET | Header and row checkboxes are 16px with no 24px hit area | Wrap in a 24px target | inbox |
| prototype/src/components/DataTable.tsx:223 | SIZE | Selection bar `w-0.5` literal | Token for the 2px bar | inbox |
| prototype/src/components/FilterBar.tsx:109 | ARIA | `aria-label="modified"` on a bare span | Role or sr-only text | inbox |
| prototype/src/components/FilterBar.tsx:114 | LABEL | Key hint "Cmd S"; elsewhere "⌘↵" (IncidentScreen:227) and "Ctrl K" (AppShell:107) | One notation, set by foundation | inbox |
| prototype/src/components/FilterBar.tsx:128 | LABEL | Invalid-token chip uses a dashed border, which components.md reserves for proposed severity | Solid border plus error text | inbox |
| prototype/src/components/FilterBar.tsx:130 | TARGET | Remove-token button is a 12px icon with no padding | 24px hit area | inbox |
| prototype/src/components/SplitPane.tsx:79 | FOCUS | `outline-none` on the tabIndex=-1 detail pane | Keep a visible focus style | inbox |
| prototype/src/screens/inbox/Preview.tsx:10 | TYPE | Caps label `text-xs font-medium uppercase tracking-wide` (tracking 0.025em, weight 500) instead of the `caps` utility (0.06em, 600) | Use `caps` | inbox |
| prototype/src/screens/inbox/Preview.tsx:51 | TYPE | Same caps recipe as line 10 | Use `caps` | inbox |
| prototype/src/screens/inbox/Preview.tsx:36, 42 | SPACE | `gap-4` and `gap-y-3` ignore density | Use `gap-gap` | inbox |
| prototype/src/screens/NowScreen.tsx:28 | TYPE | Page title `text-2xl` (40px). Page titles are lg (20px); 2xl is the hero metric only | `text-lg` | now |
| prototype/src/screens/NowScreen.tsx:39, 53, 76, 82 | TYPE | Caps labels use `text-xs font-medium uppercase tracking-wide`, not the `caps` utility | Use `caps` | now |
| prototype/src/screens/NowScreen.tsx:56 | STATE | Debt tiles, coverage, and span never pass `state` loading or error; MetricTile supports both | Wire loading and error | now |
| prototype/src/screens/NowScreen.tsx:68 | SEV-HUE | Uncovered-gaps tile passes `sev={2}`, showing an amber SEV2 chip on a gap count. Spec: gaps are red hatch, never a severity chip | Hatch treatment, no chip | now |
| prototype/src/screens/now/SpanPanel.tsx:29 | SEV-HUE | `bg-sev2-mark` marks over-baseline operator load. Tokens: sev* only for severity, gap, or error | Ink or fg token; the text already states the condition | now |
| prototype/src/screens/now/SpanPanel.tsx:12 | STATE | Empty `spans` renders no empty state | EmptyState | now |
| prototype/src/screens/now/SpanPanel.tsx:30; prototype/src/components/MetricTile.tsx:74 | SIZE | 2px baseline and target ticks `w-0.5` are literals | Token for the 2px tick | now |
| prototype/src/components/CoverageBar.tsx:28 | STATE | No loading, empty, or error state (spec 9 requires them); empty segments draw blank lanes | Add all three | now |
| prototype/src/components/CoverageBar.tsx:58, 66, 94, 99 | SIZE | Lane label column `calc(var(--spacing)*32)` (128px) repeated four times with no token | Named lane-width token | now |
| prototype/src/components/CoverageBar.tsx:73 | COLOR | `bg-surface-sunken/60` alpha track; not in the token set | Token | now |
| prototype/src/components/CoverageBar.tsx:76 | COLOR | `text-sev1-fg` drawn over `hatch-gap`; background is not in tokens, so the pair is unverified | Verify after theme.css:290 fix | now |
| prototype/src/components/CoverageBar.tsx:69, 101 | TYPE | Body metadata at `text-xs` (11px). Tokens reserve xs for caps labels, column headers, and footnotes | `text-sm` | now |
| prototype/src/components/MetricTile.tsx:95 | ARIA | Focusable div with no role when `definition` is set | Give it a role, or drop tabIndex | now |
| prototype/src/screens/IncidentScreen.tsx:183 | ARIA | Nested `<main aria-label="Activity">` inside AppShell's `<main id="main">`: two main landmarks | Use section or div role=region | incident |
| prototype/src/screens/IncidentScreen.tsx:37 | STATE | Missing incident shows EmptyState "no-results" with no ref id. Spec 12: errors use ErrorState with a mono ref | ErrorState, blocking, with refId | incident |
| prototype/src/screens/IncidentScreen.tsx:33 | STATE | No loading state; Timeline's `loading` prop is never used | Add LoadingState, or document as sync-only | incident |
| prototype/src/screens/IncidentScreen.tsx:169 | LABEL | "No owner" chip with a dashed border (dashed means proposed severity); Inbox says "Unowned" | Match the term; solid border | incident |
| prototype/src/screens/IncidentScreen.tsx:122, 227 | LABEL | Key hints "Cmd-K" and "⌘↵" vs "Ctrl K" in AppShell and "Cmd S" in FilterBar | One notation, set by foundation | incident |
| prototype/src/screens/IncidentScreen.tsx:115 | SPACE | `pt-3 pb-3` ignores density (use the pad token) | `py-pad` | incident |
| prototype/src/screens/IncidentScreen.tsx:134, 184 | SIZE | `max-w-4xl` is a Tailwind default container, not a token | Token | incident |
| prototype/src/screens/incident/ContextPanel.tsx:13 | TYPE | Card titles `text-base` (14px). PaneHeader and Timeline titles use `text-md` (16px) | `text-md` | incident |
| prototype/src/screens/incident/ContextPanel.tsx:37 | SIZE | Side pane `w-96` (384px) literal | Token | incident |
| prototype/src/screens/incident/ContextPanel.tsx:24, 39 | SIZE | KV label column `w-20` and map frame `h-56` literals | Tokens | incident |
| prototype/src/components/Timeline.tsx:110 | TARGET | DriveStrip tag buttons are about 18px (glyph plus p-px), under 24px | 24px hit area | incident |
| prototype/src/components/RouteMap.tsx:78 | TARGET | Marker buttons are about 16px (`size-3.5` plus p-px), under 24px | 24px hit area; keep the 14px visual | incident |
| prototype/src/components/RouteMap.tsx:30 | COLOR | `opacity-50` on the Stale hazard glyph; graphic contrast unverified | Token for Stale | incident |
| prototype/src/components/RouteMap.tsx:80, 86 | COLOR | `bg-surface/80` and `bg-surface/90` behind labels; derived colors, not in tokens | Token | incident |
| prototype/src/components/RouteMap.tsx:30, 34 | SIZE | Glyphs `size-3.5` (14px) are literals | Token | incident |
| prototype/src/components/RouteMap.tsx:66 | STATE | No error fallback (spec 7: static route list) | Add fallback | incident |
| prototype/src/screens/EscalationScreen.tsx:32 | LABEL | Error action is labelled "Retry" but navigates to /now | Label it "Back to Now" | escalation |
| prototype/src/screens/EscalationScreen.tsx:23 | STATE | No loading state (sync fixtures) | Add, or document as sync-only | escalation |
| prototype/src/screens/EscalationScreen.tsx:56 | ARIA | Page has no h1 | Add an h1 | escalation |
| prototype/src/screens/EscalationScreen.tsx:66, 80, 103, 125, 137 | TYPE | Section caps labels `text-sm uppercase` (12px, no tracking). Differs from Now (11px) and from the `caps` utility | Use `caps` | escalation |
| prototype/src/screens/EscalationScreen.tsx:67 | TYPE | Incident title `text-xl` (28px, the metric size); page titles are lg | `text-lg` | escalation |
| prototype/src/screens/EscalationScreen.tsx:65, 78, 102, 124, 136 | RADIUS | Section cards `rounded-lg` (8px); tokens say panes and cards are md | `rounded-md` | escalation |
| prototype/src/screens/EscalationScreen.tsx:68, 78, 79, 88, 106, 129 | SPACE | `gap-x-4`, `gap-3`, `gap-4`, `p-3` literals. Compact shows 16/12 instead of 12/8 | `gap-gap` and `p-pad` | escalation |
| prototype/src/screens/EscalationScreen.tsx:104 | STATE | Page history list is blank when there are no events | "No events yet" state | escalation |
| prototype/src/screens/EscalationScreen.tsx:131 | LABEL | Rota reach labels "On call / Unreachable / Off call" vs EscalationCard.tsx:26 "Reachable / Unreachable / Unknown" | One reach vocabulary | escalation |
| prototype/src/components/EscalationCard.tsx:99 | LABEL | Chain state "Done", while the lifecycle words are Acknowledged and Handled (data/types.ts:180) | Use the lifecycle words | escalation |
| prototype/src/screens/OwnedScreen.tsx:2 | STATE | Stub `<div>owned</div>`: no empty, loading, or error state, no chrome; route is live in nav | Build it, or hide the route | inbox (proposed) |
| prototype/src/screens/ReviewScreen.tsx:2 | STATE | Stub `<div>review</div>`: same | Build it, or hide the route | inbox (proposed) |
| prototype/src/screens/PlanScreen.tsx:2 | STATE | Stub `<div>plan</div>`: same | Build it, or hide the route | now (proposed) |
| prototype/src/screens/FleetScreen.tsx:2 | STATE | Stub `<div>fleet</div>`: same | Build it, or hide the route | unrouted |

## Checked, no finding

- Hex, rgb, hsl, or oklch literals in src outside theme.css: 0. The one match is an incident ID in a comment (CommandPalette.tsx:33).
- Raw Tailwind palette colors (gray, red, white, and so on) and arbitrary `text-[...]` sizes: 0.
- Inline `style` colors: 0.
- Color utilities that reference a token not defined in theme.css: 0.
- Off-scale weights (bold, light, and so on): 0.
- Icon-only interactive elements without `aria-label`: 0. All `IconButton` uses carry `label`.
- Focus styles: the global `:focus-visible` rule in theme.css covers every other interactive element.

## Totals by rule

| rule | count |
|---|---|
| ARIA | 7 |
| COLOR | 8 |
| FOCUS | 3 |
| ICON | 2 |
| LABEL | 10 |
| MIRROR | 3 |
| RADIUS | 1 |
| SEV-HUE | 2 |
| SIZE | 14 |
| SPACE | 6 |
| STATE | 14 |
| TARGET | 4 |
| TYPE | 8 |
| **Total** | **82** |

## Totals by owner

| owner | count |
|---|---|
| foundation | 22 |
| inbox | 19 (17 fixes, 2 proposed stub routes) |
| now | 14 (13 fixes, 1 proposed stub route) |
| incident | 16 |
| escalation | 10 |
| unrouted | 1 (FleetScreen stub) |
| **Total** | **82** |

Counts are one per table row. Rows that list several line numbers in one file count once.
