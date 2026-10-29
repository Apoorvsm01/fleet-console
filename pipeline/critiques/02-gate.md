# Gate 2 critique (human + Opus), round 2 fixes

Reviewed: now-light.png, escalation-acked-light.png, inbox-dark-compact.png (1440×900 @2x).

| # | Owner | Severity | Problem | Fix |
|---|---|---|---|---|
| 1 | inbox | 🔴 | With the preview pane open at 1440, the table still clips: the Status header shows only "STA", and Owner and Age are off-screen. The status bars render as tiny dots. | Fit every column inside the table pane at 1440 with preview open. Narrow or drop Vehicle when the preview is open (it is in the preview anyway), make Title the only flexible column, and render the status marker at its spec size with the label. No horizontal scroll at ≥1280. |
| 2 | inbox | 🟠 | Preview header: the title truncates, and "INC-4140" wraps onto two lines next to "Open incident". | Put the ID on one line (nowrap, mono) above or beside a 2-line-clamped title. Move "Open incident" into the action row. |
| 3 | inbox | 🟠 | `SEV2?` (a severity proposed from the tag type) is unexplained to a first-time user. | Add a one-line legend near the group header or the filter bar: "SEV? = proposed from tag type, confirm with 1–3". Give the `?` chip a tooltip with the same text. |
| 4 | foundation (EscalationCard) | 🟠 | Compact/secondary variant: the title is crushed to "Unexpe…" and the row leaves dead space below it. | The secondary escalation is a full-width compact row: SEV chip, ID, a title of at least 40ch with ellipsis, a "Waiting on <name>" line, timer, and View. Never truncate under ~30 characters. |
| 5 | foundation (EscalationCard) | 🟡 | The SEV1 triangle appears twice: a standalone red icon plus the triangle inside the SEV1 chip. | One mark only: keep the chip and drop the standalone icon. |
| 6 | foundation (CoverageBar) | 🟠 | Hatched gap labels clip ("Uncove", "Uncovered 02:0…"). | When a segment can't fit its label, show a short form ("Gap") or the label outside or above the segment. The full time always goes in a tooltip and aria-label. Never cut text mid-word. |
| 7 | now | 🟠 | The second escalation sits in a narrow right column beside the primary card, leaving a big empty area. | Stack escalations full-width: the primary card, then secondary compact rows below it (uses fix #4). Reclaim the vertical space so coverage and span move up. |
| 8 | escalation | 🟠 | The content column is off-center, with a wide empty left gutter. In the narrow right column, long names wrap over 3 to 4 lines. | Center the two-column layout in the content area (or left-align it with the page padding, matching the header). Widen the right column (~400px) and give long names a 1-line ellipsis with a tooltip. |
| 9 | escalation | 🟡 | "Mark escalation resolved" looks enabled at 2 of 5. | A clearly disabled style while steps remain, with the reason on the same line. |
