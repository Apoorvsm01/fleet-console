# Contrast check (WCAG 2.x)

Mechanical check from `pipeline/scripts/contrast.py` against `pipeline/tokens.json` (read only). Semantic tokens are resolved through the primitive scale for both themes. Ratios are floored to 2 decimals. Text needs 4.5:1; non-text UI that carries meaning needs 3:1.

**Pairs checked:** 194 (97 light, 97 dark). **Failures:** 6.

## Failures

- **light** `status-off` (#cbd0d8) on `surface-sunken` (#eef0f3): 1.35:1, needs 3.0:1. Smallest fix: change `light.status-off` from #cbd0d8 to **#7f8b9f** (ratio 3.01:1). Check other pairs that use this token.
- **light** `status-off` (#cbd0d8) on `surface-selected` (#f0f4fe): 1.40:1, needs 3.0:1. Smallest fix: change `light.status-off` from #cbd0d8 to **#828ea2** (ratio 3.00:1). Check other pairs that use this token.
- **dark** `status-off` (#3a414e) on `surface-selected` (#18233f): 1.51:1, needs 3.0:1. Smallest fix: change `dark.status-off` from #3a414e to **#626e84** (ratio 3.02:1). Check other pairs that use this token.
- **light** `status-off` (#cbd0d8) on `surface` (#ffffff): 1.54:1, needs 3.0:1. Smallest fix: change `light.status-off` from #cbd0d8 to **#8a95a7** (ratio 3.02:1). Check other pairs that use this token.
- **dark** `status-off` (#3a414e) on `surface` (#171a21): 1.69:1, needs 3.0:1. Smallest fix: change `dark.status-off` from #3a414e to **#5b667a** (ratio 3.00:1). Check other pairs that use this token.
- **dark** `status-off` (#3a414e) on `surface-sunken` (#0a0b0e): 1.91:1, needs 3.0:1. Smallest fix: change `dark.status-off` from #3a414e to **#535e70** (ratio 3.00:1). Check other pairs that use this token.

## Passing pairs

| theme | fg token | bg token | ratio | required |
|---|---|---|---|---|
| light | fg | canvas | 16.24 | 4.5 |
| light | fg-muted | canvas | 6.78 | 4.5 |
| light | fg-subtle | canvas | 5.08 | 4.5 |
| light | fg-link | canvas | 5.50 | 4.5 |
| light | accent | canvas | 5.50 | 4.5 |
| light | sev1-fg | canvas | 8.39 | 4.5 |
| light | sev2-fg | canvas | 5.90 | 4.5 |
| light | sev3-fg | canvas | 5.81 | 4.5 |
| light | flag-fg | canvas | 6.20 | 4.5 |
| light | fg | surface | 17.41 | 4.5 |
| light | fg-muted | surface | 7.27 | 4.5 |
| light | fg-subtle | surface | 5.45 | 4.5 |
| light | fg-link | surface | 5.90 | 4.5 |
| light | accent | surface | 5.90 | 4.5 |
| light | sev1-fg | surface | 8.99 | 4.5 |
| light | sev2-fg | surface | 6.32 | 4.5 |
| light | sev3-fg | surface | 6.22 | 4.5 |
| light | flag-fg | surface | 6.64 | 4.5 |
| light | fg | surface-sunken | 15.24 | 4.5 |
| light | fg-muted | surface-sunken | 6.36 | 4.5 |
| light | fg-subtle | surface-sunken | 4.77 | 4.5 |
| light | fg-link | surface-sunken | 5.16 | 4.5 |
| light | accent | surface-sunken | 5.16 | 4.5 |
| light | sev1-fg | surface-sunken | 7.88 | 4.5 |
| light | sev2-fg | surface-sunken | 5.54 | 4.5 |
| light | sev3-fg | surface-sunken | 5.45 | 4.5 |
| light | flag-fg | surface-sunken | 5.82 | 4.5 |
| light | fg | surface-raised | 17.41 | 4.5 |
| light | fg-muted | surface-raised | 7.27 | 4.5 |
| light | fg-subtle | surface-raised | 5.45 | 4.5 |
| light | fg-link | surface-raised | 5.90 | 4.5 |
| light | accent | surface-raised | 5.90 | 4.5 |
| light | sev1-fg | surface-raised | 8.99 | 4.5 |
| light | sev2-fg | surface-raised | 6.32 | 4.5 |
| light | sev3-fg | surface-raised | 6.22 | 4.5 |
| light | flag-fg | surface-raised | 6.64 | 4.5 |
| light | fg | surface-hover | 15.24 | 4.5 |
| light | fg-muted | surface-hover | 6.36 | 4.5 |
| light | fg-subtle | surface-hover | 4.77 | 4.5 |
| light | fg-link | surface-hover | 5.16 | 4.5 |
| light | accent | surface-hover | 5.16 | 4.5 |
| light | sev1-fg | surface-hover | 7.88 | 4.5 |
| light | sev2-fg | surface-hover | 5.54 | 4.5 |
| light | sev3-fg | surface-hover | 5.45 | 4.5 |
| light | flag-fg | surface-hover | 5.82 | 4.5 |
| light | fg | surface-selected | 15.81 | 4.5 |
| light | fg-muted | surface-selected | 6.60 | 4.5 |
| light | fg-subtle | surface-selected | 4.95 | 4.5 |
| light | fg-link | surface-selected | 5.36 | 4.5 |
| light | accent | surface-selected | 5.36 | 4.5 |
| light | sev1-fg | surface-selected | 8.17 | 4.5 |
| light | sev2-fg | surface-selected | 5.74 | 4.5 |
| light | sev3-fg | surface-selected | 5.65 | 4.5 |
| light | flag-fg | surface-selected | 6.04 | 4.5 |
| light | on-sev1 | sev1-mark | 6.57 | 4.5 |
| light | fg-on-accent | accent | 5.90 | 4.5 |
| light | sev1-fg | sev1-bg | 7.86 | 4.5 |
| light | sev2-fg | sev2-bg | 5.64 | 4.5 |
| light | sev3-fg | sev3-bg | 5.44 | 4.5 |
| light | flag-fg | flag-bg | 5.61 | 4.5 |
| light | accent-subtle-fg | accent-subtle | 6.79 | 4.5 |
| light | line-strong | canvas | 4.40 | 3.0 |
| light | line-strong | surface | 4.72 | 3.0 |
| light | line-strong | surface-sunken | 4.13 | 3.0 |
| light | line-strong | surface-raised | 4.72 | 3.0 |
| light | line-strong | surface-hover | 4.13 | 3.0 |
| light | line-strong | surface-selected | 4.29 | 3.0 |
| light | focus | canvas | 5.50 | 3.0 |
| light | focus | surface | 5.90 | 3.0 |
| light | focus | surface-sunken | 5.16 | 3.0 |
| light | focus | surface-raised | 5.90 | 3.0 |
| light | focus | surface-hover | 5.16 | 3.0 |
| light | focus | surface-selected | 5.36 | 3.0 |
| light | sev1-mark | surface | 6.57 | 3.0 |
| light | sev1-mark | surface-hover | 5.75 | 3.0 |
| light | sev1-mark | surface-selected | 5.97 | 3.0 |
| light | sev2-mark | surface | 4.23 | 3.0 |
| light | sev2-mark | surface-hover | 3.71 | 3.0 |
| light | sev2-mark | surface-selected | 3.85 | 3.0 |
| light | sev3-mark | surface | 6.22 | 3.0 |
| light | sev3-mark | surface-hover | 5.45 | 3.0 |
| light | sev3-mark | surface-selected | 5.65 | 3.0 |
| light | status-on | surface | 7.27 | 3.0 |
| light | status-on | surface-sunken | 6.36 | 3.0 |
| light | status-on | surface-selected | 6.60 | 3.0 |
| light | status-done | surface | 5.90 | 3.0 |
| light | status-done | surface-sunken | 5.16 | 3.0 |
| light | status-done | surface-selected | 5.36 | 3.0 |
| light | sev2-line | sev2-bg | 3.78 | 3.0 |
| light | sev3-line | surface | 6.22 | 3.0 |
| light | sev3-line | sev3-bg | 5.44 | 3.0 |
| light | flag-line | flag-bg | 5.61 | 3.0 |
| light | flag-line | surface | 6.64 | 3.0 |
| light | accent | accent-subtle | 4.94 | 3.0 |
| dark | fg | canvas | 16.66 | 4.5 |
| dark | fg-muted | canvas | 12.28 | 4.5 |
| dark | fg-subtle | canvas | 7.39 | 4.5 |
| dark | fg-link | canvas | 8.36 | 4.5 |
| dark | accent | canvas | 8.36 | 4.5 |
| dark | sev1-fg | canvas | 11.20 | 4.5 |
| dark | sev2-fg | canvas | 11.55 | 4.5 |
| dark | sev3-fg | canvas | 11.05 | 4.5 |
| dark | flag-fg | canvas | 8.20 | 4.5 |
| dark | fg | surface | 15.24 | 4.5 |
| dark | fg-muted | surface | 11.23 | 4.5 |
| dark | fg-subtle | surface | 6.76 | 4.5 |
| dark | fg-link | surface | 7.65 | 4.5 |
| dark | accent | surface | 7.65 | 4.5 |
| dark | sev1-fg | surface | 10.25 | 4.5 |
| dark | sev2-fg | surface | 10.57 | 4.5 |
| dark | sev3-fg | surface | 10.11 | 4.5 |
| dark | flag-fg | surface | 7.50 | 4.5 |
| dark | fg | surface-sunken | 17.23 | 4.5 |
| dark | fg-muted | surface-sunken | 12.70 | 4.5 |
| dark | fg-subtle | surface-sunken | 7.64 | 4.5 |
| dark | fg-link | surface-sunken | 8.65 | 4.5 |
| dark | accent | surface-sunken | 8.65 | 4.5 |
| dark | sev1-fg | surface-sunken | 11.59 | 4.5 |
| dark | sev2-fg | surface-sunken | 11.94 | 4.5 |
| dark | sev3-fg | surface-sunken | 11.43 | 4.5 |
| dark | flag-fg | surface-sunken | 8.48 | 4.5 |
| dark | fg | surface-raised | 12.43 | 4.5 |
| dark | fg-muted | surface-raised | 9.16 | 4.5 |
| dark | fg-subtle | surface-raised | 5.51 | 4.5 |
| dark | fg-link | surface-raised | 6.24 | 4.5 |
| dark | accent | surface-raised | 6.24 | 4.5 |
| dark | sev1-fg | surface-raised | 8.36 | 4.5 |
| dark | sev2-fg | surface-raised | 8.61 | 4.5 |
| dark | sev3-fg | surface-raised | 8.24 | 4.5 |
| dark | flag-fg | surface-raised | 6.11 | 4.5 |
| dark | fg | surface-hover | 14.11 | 4.5 |
| dark | fg-muted | surface-hover | 10.39 | 4.5 |
| dark | fg-subtle | surface-hover | 6.26 | 4.5 |
| dark | fg-link | surface-hover | 7.08 | 4.5 |
| dark | accent | surface-hover | 7.08 | 4.5 |
| dark | sev1-fg | surface-hover | 9.49 | 4.5 |
| dark | sev2-fg | surface-hover | 9.78 | 4.5 |
| dark | sev3-fg | surface-hover | 9.36 | 4.5 |
| dark | flag-fg | surface-hover | 6.94 | 4.5 |
| dark | fg | surface-selected | 13.61 | 4.5 |
| dark | fg-muted | surface-selected | 10.03 | 4.5 |
| dark | fg-subtle | surface-selected | 6.04 | 4.5 |
| dark | fg-link | surface-selected | 6.83 | 4.5 |
| dark | accent | surface-selected | 6.83 | 4.5 |
| dark | sev1-fg | surface-selected | 9.15 | 4.5 |
| dark | sev2-fg | surface-selected | 9.43 | 4.5 |
| dark | sev3-fg | surface-selected | 9.03 | 4.5 |
| dark | flag-fg | surface-selected | 6.69 | 4.5 |
| dark | on-sev1 | sev1-mark | 7.35 | 4.5 |
| dark | fg-on-accent | accent | 8.36 | 4.5 |
| dark | sev1-fg | sev1-bg | 9.54 | 4.5 |
| dark | sev2-fg | sev2-bg | 8.41 | 4.5 |
| dark | sev3-fg | sev3-bg | 8.38 | 4.5 |
| dark | flag-fg | flag-bg | 6.49 | 4.5 |
| dark | accent-subtle-fg | accent-subtle | 9.55 | 4.5 |
| dark | line-strong | canvas | 4.02 | 3.0 |
| dark | line-strong | surface | 3.68 | 3.0 |
| dark | line-strong | surface-sunken | 4.16 | 3.0 |
| dark | line-strong | surface-raised | 3.00 | 3.0 |
| dark | line-strong | surface-hover | 3.41 | 3.0 |
| dark | line-strong | surface-selected | 3.29 | 3.0 |
| dark | focus | canvas | 8.36 | 3.0 |
| dark | focus | surface | 7.65 | 3.0 |
| dark | focus | surface-sunken | 8.65 | 3.0 |
| dark | focus | surface-raised | 6.24 | 3.0 |
| dark | focus | surface-hover | 7.08 | 3.0 |
| dark | focus | surface-selected | 6.83 | 3.0 |
| dark | sev1-mark | surface | 6.73 | 3.0 |
| dark | sev1-mark | surface-hover | 6.23 | 3.0 |
| dark | sev1-mark | surface-selected | 6.01 | 3.0 |
| dark | sev2-mark | surface | 9.21 | 3.0 |
| dark | sev2-mark | surface-hover | 8.52 | 3.0 |
| dark | sev2-mark | surface-selected | 8.22 | 3.0 |
| dark | sev3-mark | surface | 8.29 | 3.0 |
| dark | sev3-mark | surface-hover | 7.68 | 3.0 |
| dark | sev3-mark | surface-selected | 7.40 | 3.0 |
| dark | status-on | surface | 11.23 | 3.0 |
| dark | status-on | surface-sunken | 12.70 | 3.0 |
| dark | status-on | surface-selected | 10.03 | 3.0 |
| dark | status-done | surface | 7.65 | 3.0 |
| dark | status-done | surface-sunken | 8.65 | 3.0 |
| dark | status-done | surface-selected | 6.83 | 3.0 |
| dark | sev2-line | sev2-bg | 3.27 | 3.0 |
| dark | sev3-line | surface | 8.29 | 3.0 |
| dark | sev3-line | sev3-bg | 6.87 | 3.0 |
| dark | flag-line | flag-bg | 6.49 | 3.0 |
| dark | flag-line | surface | 7.50 | 3.0 |
| dark | accent | accent-subtle | 6.21 | 3.0 |

## Claimed vs computed (tokens.json `contrast` block)

Mismatch means the computed ratio differs from the claim by more than 5%.

| theme | claim | fg | bg | claimed | computed | match |
|---|---|---|---|---|---|---|
| light | fg on canvas/surface | fg | canvas | ~16:1 | 16.24:1 | yes |
| light | fg on canvas/surface | fg | surface | ~16:1 | 17.41:1 | MISMATCH |
| light | fg-muted on canvas | fg-muted | canvas | ~7:1 | 6.78:1 | yes |
| light | fg-subtle on surface-sunken | fg-subtle | surface-sunken | ~4.8:1 | 4.77:1 | yes |
| light | line-strong on surface (controls) | line-strong | surface | ~4.7:1 | 4.72:1 | yes |
| light | on-sev1 on sev1-mark | on-sev1 | sev1-mark | ~6.5:1 | 6.57:1 | yes |
| light | sev1-fg on sev1-bg | sev1-fg | sev1-bg | ~8:1 | 7.86:1 | yes |
| light | sev2-fg on sev2-bg | sev2-fg | sev2-bg | ~5.6:1 | 5.64:1 | yes |
| light | sev3-fg on sev3-bg | sev3-fg | sev3-bg | ~5.4:1 | 5.44:1 | yes |
| light | sev2-mark on surface (graphic) | sev2-mark | surface | ~4.2:1 | 4.23:1 | yes |
| light | accent on surface | accent | surface | ~5.9:1 | 5.90:1 | yes |
| dark | fg on surface | fg | surface | ~15:1 | 15.24:1 | yes |
| dark | fg-subtle on surface-raised | fg-subtle | surface-raised | ~5.5:1 | 5.51:1 | yes |
| dark | line-strong on surface (controls) | line-strong | surface | ~3.7:1 | 3.68:1 | yes |
| dark | on-sev1 on sev1-mark | on-sev1 | sev1-mark | ~7:1 | 7.35:1 | MISMATCH |
| dark | sev1-fg on sev1-bg | sev1-fg | sev1-bg | ~10:1 | 9.54:1 | yes |
| dark | accent on surface | accent | surface | ~7.7:1 | 7.65:1 | yes |

## Notes

- Disabled controls (`fg-subtle` at 60%, per components.md) are exempt from WCAG and are not checked.
- `hatch-gap` (components.md section 9, uncovered shifts) is not defined in tokens.json, so it is not checked.
- `sev1-line` is not checked: components.md says SEV1 has no border. `line` (decorative divider) is not checked.
- The 3:1 large-text rule was not used to relax any text pair. All text is held to 4.5:1.
- `theme.css` was not checked; it is a mirror of tokens.json and may drift.
