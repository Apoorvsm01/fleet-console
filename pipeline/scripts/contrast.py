#!/usr/bin/env python3
"""WCAG 2.x contrast check for the Plumb design tokens.

Reads tokens.json (read only), resolves semantic colour tokens to hex for the
light and dark themes, computes contrast ratios for the meaningful
foreground/background pairs, prints a table and optionally writes a Markdown
report. Run with: python3 -I contrast.py [--tokens PATH] [--md PATH]
"""

import argparse
import colorsys
import json
import math
import re

DEFAULT_TOKENS = "/Users/apoorv/Projects/fleet-console/pipeline/tokens.json"
DEFAULT_MD = "/Users/apoorv/Projects/fleet-console/pipeline/critiques/00-contrast.md"

TEXT_REQ = 4.5
UI_REQ = 3.0

HEX_RE = re.compile(r"^#?([0-9a-fA-F]{6})$")
REF_RE = re.compile(r"^\{([^{}]+)\}$")

SURFACES = [
    "canvas", "surface", "surface-sunken", "surface-raised",
    "surface-hover", "surface-selected",
]
TEXT_ON_SURFACE = [
    "fg", "fg-muted", "fg-subtle", "fg-link", "accent",
    "sev1-fg", "sev2-fg", "sev3-fg", "flag-fg",
]
# (fg, bg): text sitting on a filled chip or button
TEXT_ON_FILL = [
    ("on-sev1", "sev1-mark"),
    ("fg-on-accent", "accent"),
    ("sev1-fg", "sev1-bg"),
    ("sev2-fg", "sev2-bg"),
    ("sev3-fg", "sev3-bg"),
    ("flag-fg", "flag-bg"),
    ("accent-subtle-fg", "accent-subtle"),
]
# non-text UI that carries meaning (3:1)
# sev1-line is omitted: components.md says SEV1 has no border.
# line (decorative divider) is omitted: it carries no meaning.
UI_PAIRS = (
    [("line-strong", s) for s in SURFACES]
    + [("focus", s) for s in SURFACES]
    + [(m, s) for m in ("sev1-mark", "sev2-mark", "sev3-mark")
       for s in ("surface", "surface-hover", "surface-selected")]
    + [(t, s) for t in ("status-off", "status-on", "status-done")
       for s in ("surface", "surface-sunken", "surface-selected")]
    + [
        ("sev2-line", "sev2-bg"),
        ("sev3-line", "surface"),
        ("sev3-line", "sev3-bg"),
        ("flag-line", "flag-bg"),
        ("flag-line", "surface"),
        ("accent", "accent-subtle"),
    ]
)

# Contrast numbers claimed in tokens.json "contrast" block, mapped to pairs.
CLAIMS = [
    ("light", "fg on canvas/surface", [("fg", "canvas"), ("fg", "surface")], 16),
    ("light", "fg-muted on canvas", [("fg-muted", "canvas")], 7),
    ("light", "fg-subtle on surface-sunken", [("fg-subtle", "surface-sunken")], 4.8),
    ("light", "line-strong on surface (controls)", [("line-strong", "surface")], 4.7),
    ("light", "on-sev1 on sev1-mark", [("on-sev1", "sev1-mark")], 6.5),
    ("light", "sev1-fg on sev1-bg", [("sev1-fg", "sev1-bg")], 8),
    ("light", "sev2-fg on sev2-bg", [("sev2-fg", "sev2-bg")], 5.6),
    ("light", "sev3-fg on sev3-bg", [("sev3-fg", "sev3-bg")], 5.4),
    ("light", "sev2-mark on surface (graphic)", [("sev2-mark", "surface")], 4.2),
    ("light", "accent on surface", [("accent", "surface")], 5.9),
    ("dark", "fg on surface", [("fg", "surface")], 15),
    ("dark", "fg-subtle on surface-raised", [("fg-subtle", "surface-raised")], 5.5),
    ("dark", "line-strong on surface (controls)", [("line-strong", "surface")], 3.7),
    ("dark", "on-sev1 on sev1-mark", [("on-sev1", "sev1-mark")], 7),
    ("dark", "sev1-fg on sev1-bg", [("sev1-fg", "sev1-bg")], 10),
    ("dark", "accent on surface", [("accent", "surface")], 7.7),
]


def norm_hex(value):
    m = HEX_RE.match(value.strip())
    if not m:
        raise ValueError(f"not a hex colour: {value!r}")
    return "#" + m.group(1).lower()


def rgb(hx):
    h = hx.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def to_hex(channels):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(c))) for c in channels)


def linearise(c8):
    c = c8 / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hx):
    r, g, b = (linearise(c) for c in rgb(hx))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    """WCAG 2.x contrast ratio, symmetric in its arguments."""
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def resolve(doc, theme, value, depth=0):
    """Resolve a token value to hex, following {family.step} and {semantic} refs."""
    if depth > 8:
        raise ValueError("reference loop")
    if not isinstance(value, str):
        raise ValueError(f"unsupported value {value!r}")
    if HEX_RE.match(value.strip()):
        return norm_hex(value)
    m = REF_RE.match(value.strip())
    if not m:
        raise ValueError(f"unsupported value {value!r}")
    path = m.group(1).split(".")
    prim = doc["color"]["primitive"]
    step = ".".join(path[1:])
    if path[0] in prim and step in prim[path[0]]:
        return norm_hex(prim[path[0]][step])
    sem = doc["color"]["semantic"][theme]
    if len(path) == 1 and path[0] in sem:
        return resolve(doc, theme, sem[path[0]], depth + 1)
    raise KeyError(f"unresolved reference {value!r} in theme {theme}")


def semantic(doc, theme):
    return {k: resolve(doc, theme, v) for k, v in doc["color"]["semantic"][theme].items()}


def build_pairs():
    pairs = []
    for s in SURFACES:
        for t in TEXT_ON_SURFACE:
            pairs.append((t, s, TEXT_REQ, "text"))
    for fg, bg in TEXT_ON_FILL:
        pairs.append((fg, bg, TEXT_REQ, "text"))
    for fg, bg in UI_PAIRS:
        pairs.append((fg, bg, UI_REQ, "ui"))
    seen, unique = set(), []
    for p in pairs:
        if (p[0], p[1]) not in seen:
            seen.add((p[0], p[1]))
            unique.append(p)
    return unique


def suggest(sem, fg, bg, req):
    """Smallest lightness nudge (HLS, same hue and saturation) to one side that passes.

    Returns (side, token, old_hex, new_hex, new_ratio) or None.
    """
    best = None  # (steps, side, token, old, new, ratio)
    sides = (
        ("fg", fg, sem[fg], sem[bg]),
        ("bg", bg, sem[bg], sem[fg]),
    )
    for side, name, target, other in sides:
        r, g, b = (c / 255.0 for c in rgb(target))
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        for direction in (1, -1):
            for k in range(1, 1001):
                nl = l + direction * k / 1000.0
                if nl < 0.0 or nl > 1.0:
                    break
                nr, ng, nb = colorsys.hls_to_rgb(h, nl, s)
                new = to_hex((nr * 255, ng * 255, nb * 255))
                ratio = contrast(new, other)
                if ratio >= req:
                    cand = (k, side, name, target, new, ratio)
                    if best is None or cand[0] < best[0]:
                        best = cand
                    break
    if best is None:
        return None
    _, side, name, old, new, ratio = best
    return side, name, old, new, ratio


def floor2(x):
    return math.floor(x * 100) / 100.0


def run(doc):
    rows = []
    for theme in ("light", "dark"):
        sem = semantic(doc, theme)
        for fg, bg, req, kind in build_pairs():
            r = contrast(sem[fg], sem[bg])
            ok = r >= req
            fix = None if ok else suggest(sem, fg, bg, req)
            rows.append({
                "theme": theme, "fg": fg, "bg": bg, "kind": kind,
                "fg_hex": sem[fg], "bg_hex": sem[bg],
                "ratio": r, "req": req, "ok": ok, "fix": fix,
            })
    claims = []
    for theme, text, pairs, claimed in CLAIMS:
        sem = semantic(doc, theme)
        for fg, bg in pairs:
            r = contrast(sem[fg], sem[bg])
            diff = abs(r - claimed) / claimed
            claims.append({
                "theme": theme, "text": text, "fg": fg, "bg": bg,
                "claimed": claimed, "computed": r,
                "match": diff <= 0.05,
            })
    return rows, claims


def print_table(rows):
    head = f"{'theme':<6} | {'fg token':<18} | {'bg token':<18} | {'ratio':>6} | {'required':<8} | result"
    print(head)
    print("-" * len(head))
    for row in rows:
        req = f"{row['req']:.1f}"
        print(f"{row['theme']:<6} | {row['fg']:<18} | {row['bg']:<18} | "
              f"{floor2(row['ratio']):>6.2f} | {req:<8} | {'PASS' if row['ok'] else 'FAIL'}")


def write_md(path, rows, claims):
    total = len(rows)
    fails = [r for r in rows if not r["ok"]]
    fails.sort(key=lambda r: r["ratio"] / r["req"])
    out = []
    out.append("# Contrast check (WCAG 2.x)\n")
    out.append("Mechanical check from `pipeline/scripts/contrast.py` against `pipeline/tokens.json` "
               "(read only). Semantic tokens are resolved through the primitive scale for both themes. "
               "Ratios are floored to 2 decimals. Text needs 4.5:1; non-text UI that carries meaning needs 3:1.\n")
    out.append(f"**Pairs checked:** {total} ({sum(1 for r in rows if r['theme']=='light')} light, "
               f"{sum(1 for r in rows if r['theme']=='dark')} dark). "
               f"**Failures:** {len(fails)}.\n")

    out.append("## Failures\n")
    if not fails:
        out.append("None.\n")
    for r in fails:
        line = (f"- **{r['theme']}** `{r['fg']}` ({r['fg_hex']}) on `{r['bg']}` ({r['bg_hex']}): "
                f"{floor2(r['ratio']):.2f}:1, needs {r['req']:.1f}:1.")
        if r["fix"]:
            side, name, old, new, nr = r["fix"]
            line += (f" Smallest fix: change `{r['theme']}.{name}` from {old} to **{new}** "
                     f"(ratio {floor2(nr):.2f}:1).")
            if side == "bg":
                line += " This is a surface token, so every pair that uses it moves too."
            else:
                line += " Check other pairs that use this token."
        else:
            line += " No single-token fix found."
        out.append(line)
    out.append("")

    out.append("## Passing pairs\n")
    out.append("| theme | fg token | bg token | ratio | required |")
    out.append("|---|---|---|---|---|")
    for r in rows:
        if r["ok"]:
            out.append(f"| {r['theme']} | {r['fg']} | {r['bg']} | {floor2(r['ratio']):.2f} | {r['req']:.1f} |")
    out.append("")

    out.append("## Claimed vs computed (tokens.json `contrast` block)\n")
    out.append("Mismatch means the computed ratio differs from the claim by more than 5%.\n")
    out.append("| theme | claim | fg | bg | claimed | computed | match |")
    out.append("|---|---|---|---|---|---|---|")
    for c in claims:
        out.append(f"| {c['theme']} | {c['text']} | {c['fg']} | {c['bg']} | ~{c['claimed']}:1 | "
                   f"{floor2(c['computed']):.2f}:1 | {'yes' if c['match'] else 'MISMATCH'} |")
    out.append("")

    out.append("## Notes\n")
    out.append("- Disabled controls (`fg-subtle` at 60%, per components.md) are exempt from WCAG and are not checked.")
    out.append("- `hatch-gap` (components.md section 9, uncovered shifts) is not defined in tokens.json, so it is not checked.")
    out.append("- `sev1-line` is not checked: components.md says SEV1 has no border. `line` (decorative divider) is not checked.")
    out.append("- The 3:1 large-text rule was not used to relax any text pair. All text is held to 4.5:1.")
    out.append("- `theme.css` was not checked; it is a mirror of tokens.json and may drift.")
    out.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


def main():
    ap = argparse.ArgumentParser(description="WCAG contrast check for Plumb tokens")
    ap.add_argument("--tokens", default=DEFAULT_TOKENS)
    ap.add_argument("--md", default=None, help="write the Markdown report to this path")
    args = ap.parse_args()

    with open(args.tokens, encoding="utf-8") as f:
        doc = json.load(f)
    rows, claims = run(doc)
    print_table(rows)
    fails = [r for r in rows if not r["ok"]]
    print()
    print(f"checked {len(rows)} pairs, {len(fails)} failures")
    for r in sorted(fails, key=lambda r: r["ratio"] / r["req"])[:3]:
        print(f"  worst: {r['theme']} {r['fg']} on {r['bg']} = {floor2(r['ratio']):.2f}")
    mism = [c for c in claims if not c["match"]]
    print(f"claimed-vs-computed mismatches: {len(mism)} of {len(claims)}")
    if args.md:
        write_md(args.md, rows, claims)
        print(f"report written to {args.md}")


if __name__ == "__main__":
    main()
