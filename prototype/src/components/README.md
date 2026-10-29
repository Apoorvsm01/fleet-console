# Plumb components: API cheat sheet

Import everything from `../components` (barrel). Data from `../lib/queries`. Tokens only: use `bg-surface`, `text-fg-muted`, `h-row`, `p-pane`, `gap-gap`, `px-pad`, `h-ctl`, `h-chip`, `size-icon`. No raw px/hex. Live example of every component: route `/gallery` (`src/screens/Gallery.tsx`).

## Screen contract
- AppShell renders your screen inside `<main class="flex min-h-0 flex-1 flex-col overflow-auto">`. Your root: `className="flex min-h-0 flex-1 flex-col"`; give scrolling regions `min-h-0 flex-1`.
- Call `useStore()` (lib/store) at the top of any screen that reads queries and must re-render after a mutation.
- URL conventions (use `useQueryState(key)` from lib/useQueryState): `q` filter query, `view` saved-view id, `sel` selected row key. Nav's pinned views link to `/inbox?view=ID&q=...`.
- Fixture world is frozen at Thu 2026-10-29 15:42 UTC, PM shift. Signed-in user = `getCurrentUser()` (LD-04, PM backup lead). `ME_ID` exported from lib/queries.
- `useApp()` (lib/app): `theme, toggleTheme, density, toggleDensity, shiftId (top-bar switcher), toast({message, undo?}), setPaletteOpen`. `usePaletteActions(useMemo(()=>[{id,title,group:'selection',shortcut,run}],[...]))` registers contextual Cmd-K actions.
- `useSimNow(ms=1000)` (lib/clock): ticking simulated now (ms). Formatters in lib/time: `fmtTime fmtDateTime fmtRel fmtCountdown fmtAge fmtNum shiftOf`.

## Domain + queries (lib/queries.ts, types in data/types.ts)
Sev = 1|2|3; Status = Captured|Triaged|Owned|Resolved|Verified; Flag = Escalated|Overdue|Stale. All lists sort SEV asc, newest first.
| Helper | Returns |
|---|---|
| `getInbox('mine'\|'team', shiftId?)` | `InboxRow[]`: untriaged tags + Captured/Triaged incidents (`kind`, `key`, `id`, `incidentId?`, `sev`, `proposed`, `title`, `status`, `flags`, `ownerId?`, `shiftId`, `vehicleId`, `createdAt`, `tagCount`) |
| `getIncident(id)` | `IncidentDetail`: `incident, owner, reporter, resolver, verifier, vehicles, drives, tags, hazard, escalations, footage, timeline, nextStatus, canVerify` |
| `getIncidents(filter?)`, `getOwned(personId?)` | `IncidentRow[]` (incident + `ownerName, shiftName, vehicleLabel, tagCount`) |
| `getTimeline(incidentId)` | `TimelineEvent[]` newest first |
| `getEscalation(id)`, `getActiveEscalations(shiftId?)`, `getEscalations()` | `EscalationView`: `escalation, incident, chain[{link,person}], current, backup, raisedBy, isMine, active, rerouted`. ESC-0207 active (owner LD-01, someone else's); ESC-0206 timed out and re-routed to you (LD-04); 4 handled |
| `getNow(shiftId?)` | `{shift, leads, operators, spans, coverage, gaps, escalations, shiftEscalations, debt, programDebt, load}`; debt = `{current, previous?, history}`; `getOversightDebt(shiftId?)`; total is the plain sum of four counts |
| `getCoverage(shiftId?)`, `getGaps(shiftId?)`, `getShifts()`, `getRota()` | `CoverageSegment[]` (GY has an uncovered 02:00-06:00 gap; PM has no backup 20:00-22:00) |
| `getReviewQueue(filter?)`, `getReview(id)` | `ReviewRow[]` (derived from every incident; Overdue first) |
| `getFleet()`, `getVehicleDetail(id)`, `getDataHealth()`, `getCampaigns()`, `getHazards()`, `getMapMarkers({incidentId?, layers?})` | fleet rows (+`openIncidents`, `operator`), health rollup, ODD targets, markers |
| `getPerson(id)`, `personName(id)`, `getLeads()`, `getOperators(shiftId?)`, `getSavedViews('inbox'\|'owned'\|'review'\|'fleet')` | lookups |
Mutations (lib/store.ts, in-memory, reset on reload): `acknowledgeEscalation(id)`, `handOffEscalation(id, toLeadId)`, `assignOwner`, `setSeverity`, `advanceStatus(id, by?)` (false if resolver tries to verify), `dismissTags(ids)`, `captureTag({type, driveId, vehicleId, operatorId, shiftId, locationLabel, x?, y?, at?})` (new Captured tag, `proposedSev` from `TAG_TYPE_SEV`, notifies subscribers; returns the tag), `removeTag(id)` (Undo for captureTag; only while still Captured), `triageTags(ids, incidentId|null)`.
Added in fix round 1:
| Mutation | Use |
|---|---|
| `unassignOwner(incidentId, {ownerId?, status?})` | Undo for assign. Capture `ownerId`/`status` before assigning and pass them back. |
| `untriageTags(tagIds)` | Undo for triage. Tags return to Captured; an incident created by that triage is removed. |
| `undismissTags(tagIds)` | Undo for dismiss. |
| `raiseEscalation(incidentId)` | Returns the new (or already-active) ESC id. Chain = reporter, then the first two on-call leads. Navigate to `/escalations/:id` after. |
| `addComment(incidentId, text)` | Adds a `comment` event to the incident timeline; empty text ignored. |
| `setProtocolStep(escId, stepId, on)` / `getProtocol(escId)` | Per-escalation protocol ticks, stored on `Escalation.protocol` (step id to ISO time). Steps live in `lib/protocol.ts` (`PROTOCOL_STEPS`). Survives navigation. |
| `resolveEscalation(escId)` | Marks Handled. Returns false unless Acknowledged and all 5 steps are ticked. |
Demo: `/escalations/ESC-0206?demo=acked` (any id) preloads Acknowledged by me, 2 of 5 steps ticked, no countdown. Handled by AppShell; screens do nothing.

## Keys (lib/keys.ts is the only place keys are defined)
Never type a key letter in a screen. `useHotkeys({ acknowledge, assignMe, reassign, escalate, setSeverity(sev), advance, comment, triage, dismiss, handOff, call, openIncident, undo? }, { enabled?, scope? })` binds only the verbs you pass; return `false` from a handler for "not applicable". `keyOf('triage')` gives the character for `Button hint=` and DataTable `bulkActions[].key`. `<KeyCombo keys={['mod','k']} />` prints platform notation (⌘ on Mac, Ctrl elsewhere); `fmtKey`, `fmtCombo` for strings. Do not bind the same verb in both `useHotkeys` and DataTable `bulkActions` on one screen.
| Key | Meaning everywhere |
|---|---|
| `⌘K` / `Ctrl K` | Command palette |
| `?` | Shortcut sheet (generated from the map; also top-bar keyboard button and palette action) |
| `g` then `n i o r f p` | Go to Now, Inbox, Owned, Review, Fleet, Plan |
| `j` `k` / `x` / `Enter` / `Esc` / `/` / `\` | Next, previous / select / open (Shift: full page) / clear or close / focus filter / toggle preview |
| `a` | Acknowledge (escalation) |
| `m` | Assign to me |
| `r` | Reassign (ErrorState retry uses `r` only when it is blocking the whole screen) |
| `e` | Escalate |
| `1` `2` `3` (or `s` then 1-3) | Set severity |
| `n` | Advance status (next step; replaces `v` verify and "Move to Owned") |
| `c` | Comment |
| `t` | Mark triaged |
| `d` | Dismiss |
| `h` | Hand off (escalation) |
| `p` | Call operator (phone) |
| `o` | Open incident (from an escalation card) |
| `z` | Undo while the toast shows (handled by the shell) |
Keys are ignored while typing, while a dialog is open, and for a second after `g`. A screen shows a key hint only on the control that the key currently triggers.

## Shared copy (lib/copy.ts)
`COPY.escalation.review|view` is the one label for "go to this escalation" (banner, EscalationCard compact, palette): Review when it is yours, View when it is someone else's. Acknowledge is only the act, never a link. `COPY.unassigned` ("Unassigned") replaces Unowned / No owner. `COPY.reach` is the only reachability vocabulary. `COPY.escalation.ownerLabel` ("Escalation owner") vs `COPY.incident.ownerLabel` ("Incident owner"). GY shift displays as "Night" (fixture name).

## Tokens added in fix round 1
`h-topbar w-search w-step w-lane w-side w-kv h-map w-sheet w-bar h-bar` (2px) `bg-track text-fg-disabled bg-surface-glass`, `--duration-pulse`, `--spacing-content` (use `max-w-(--spacing-content)`), `--spacing-glyph`. Use these instead of `w-0.5`, `w-96`, `h-56`, `bg-surface/80`, `opacity-60`.

## SeverityChip
`<SeverityChip sev={1|2|3} proposed? dot? onChange? />`. Only way to show severity. `proposed` = dashed + "SEV2?". `dot` = glyph only (maps, dense timelines). `onChange` makes it a picker (`s` then 1-3). Also `SeverityGlyph`, `sevEdgeClass(sev)`, `SEV_META`.

## StatusMarker / FlagPill
`<StatusMarker status flags? flagAge={{Overdue:'2d'}} variant="inline|compact|block" steps? onAdvance? advanceDisabledReason? />`; `<FlagPill flag="Escalated|Overdue|Stale" age? />`. `block` = stepper with who/when + next-step button.

## DataTable<T>
```tsx
<DataTable ariaLabel columns={[{key,header,cell:(r)=>..,width?:24 /*x4px*/,flex?,align?:'right',mono?,sortValue?}]}
  rows rowKey={(r)=>r.key} rowSev?={(r)=>sev} groupBy?={(r)=>({key,label})} selectable
  selectedKeys?/onSelectionChange? activeKey?/onActiveChange?(key,row) onOpen?(row,{full})
  bulkActions?={[{key:'d',label:'Dismiss',run:(rows)=>undoFn}]} onKeyAction?(key,rows)=>boolean
  loading? error?={{title,detail,onRetry,refId}} empty?={<EmptyState/>} footer? highlightKeys? sort?/onSortChange? />
```
Keys: j/k, Enter, Shift+Enter (full), x/Space, Shift+j/k, Cmd+A, [ ], Esc, any bulk/onKeyAction key (e a s d v) on selection or focused row. Bulk run returns an undo fn to raise the 10 s undo toast. `width` is in spacing units (24 = 96px); a chip column that may show "SEV1?" needs 28. Fills parent (flex-1, scrolls inside).

## FilterBar + helpers
`<FilterBar fields query onQueryChange views? activeViewId? onViewChange?(id|null) onSaveView?(name?) resultCount totalCount? quick? trailing? />` with `FilterField<T> = {key,label,values?:[{value,label}],match:(row,values)=>bool}`. Query syntax `sev:1,2 owner:none -status:verified free text`. `filterRows(rows, query, fields, textOf?)` applies it; `parseQuery`. `/` focuses; Backspace removes last token; Cmd+S saves. On view select, you set the query to `view.query`.

## SplitPane
`<SplitPane list detail? emptyDetail? listLabel detailLabel detailOpen? onDetailOpenChange? apiRef? />`. `apiRef.current.focusDetail()` from table `onOpen`; Esc in detail returns to the list; `\` toggles; Alt+Left/Right resizes. Debounce detail with `useDwell(activeKey, 120)` (lib/useQueryState). Wrap in a flex column with height.

## Timeline / DriveStrip
`<Timeline events selectedId? onSelect? onReveal? renderExpanded? variant="feed|compact" showNow? loading? />` (events from `getTimeline`; `event.mapId` links to a map marker). `<DriveStrip tags={[{id,pos 0..1,sev,label}]} bands? onSelect? />`.

## RouteMap
`<RouteMap markers={getMapMarkers({incidentId?})} selectedId onSelect highlightId? compactChrome? className? />` SVG schematic, markers are buttons, layer panel (`l`), +/- zoom, arrows pan. No clustering.

## MetricTile
`<MetricTile label value unit? hero? delta?={{value,text}} ratio?={{achieved,target}} health?="Healthy|Degraded|Failing" sev? to? onClick? footer? definition? sparkline? state?="default|loading|error|stale" staleLabel? onRetry? />`. Value 0 shows "Clear" with a check. `to` makes the whole tile a link that must open the exact queue behind the number. `?` shows the definition.

## CoverageBar
`<CoverageBar segments={getCoverage()} shifts? onOpenShift?(id) onAssign?(shiftId, seg) selectedShiftId? />`. 24h axis 06:00-06:00, lanes AM/PM/GY with primary + backup rows, hatched gaps with text, now line. Keys: arrows, Enter, `a`, `t`. Gap labels adapt to segment width ("Uncovered 02:00-06:00" / "Uncovered" / "Gap"), never cut mid-word; full time is in tooltip + aria-label. Per-operator load variant is not built: use `getNow().load`.

## EscalationCard
`<EscalationCard view={getEscalation(id)!} variant?="full|compact|readonly" onAcknowledge onHandOff?(toLeadId) onCall? hideTitle? hideMeta? escalationHref? />`. `hideTitle` when the page already shows the title (escalation page, Incident); `hideMeta` hides SEV chip, vehicle, flag. Title clamps to 2 lines with the full text as tooltip. Default variant: full if `view.isMine`, else readonly. Built-in rota picker (pre-selects backup), countdown from `useSimNow`, announces once with role=alert. Keys a/Enter, h, p, o. The row of the person who must act is marked "You must act now"; timed-out owners show a "Timed out 14m ago" chip, no strikethrough. Compact variant (round 2) is a full-width row: SEV chip, incident ID, title (flex, ellipsis only when the row is narrow), "Waiting on <name>" line, timer, Review/View; use it for secondary escalations stacked under the primary card. The SEV mark appears once (chip; with `hideMeta` just the dot). Wire `onAcknowledge={()=>acknowledgeEscalation(id)}`.

## CommandPalette
Mounted by AppShell. Cmd/Ctrl+K; incident by id ("4139", "inc-4139", "#4139"); `>` actions, `@` people; Tab scopes. Vehicle/drive/person hits go to `/fleet?vehicle=ID|drive=ID|operator=ID` (the Fleet screen should read those params).

## EmptyState / LoadingState / ErrorState
`<EmptyState variant="success|first-use|no-results|no-permission" title description? action?={{label,onClick,hint?}} secondary? />`; `<LoadingState variant="rows|block|tile" rows? label delayMs? />`; `<ErrorState title detail? onRetry? refId? inline? blocking? />` (`r` retries).

## ui.tsx
`Button(variant primary|secondary|ghost, hint, disabledReason, icon)`, `IconButton(label, pressed)`, `Kbd`, `Tip`, `Avatar`, `Pill`, `PaneHeader(title, meta, actions)`, `Icon(name)`.
