"""Build the Thumb Butte logo files.

Run from the repo root (it reads the Geist fonts from node_modules):

    python3 -m pip install fonttools brotli uharfbuzz skia-pathops
    python3 brand/generator/build.py

Writes the brand SVGs to brand/, the favicon to static/favicon.svg and the
mark's paths to src/lib/brand/mark.ts. Every output is plain filled paths: no
fonts, masks, clips or strokes, so the files render the same everywhere.

The butte's outline is the skyline traced from a photo looking west down
Gurley Street (skyline.txt: photo x, y in pixels, y down).
"""

import io
import json
import statistics
from functools import lru_cache
from pathlib import Path

import pathops
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from pathops import LineCap, LineJoin, PathOp, op

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

AMBER = "#f2a35e"  # --color-accent (dark)
AMBER_PAPER = "#b5602a"  # --color-accent (light)
BONE = "#ecebe8"  # --color-text (dark)
INK = "#0b0b0c"  # --color-bg (dark)
BUTTE = "#3a332d"  # --color-logo-butte (dark)

# ---------------------------------------------------------------- geometry


def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def from_d(d):
    p = pathops.Path()
    parse_path(d, p.getPen())
    return p


def to_d(p):
    pen = SVGPathPen(None, fmt)
    p.draw(pen)
    return pen.getCommands()


def circle(cx, cy, r):
    k = r * 0.5522847498
    p = pathops.Path()
    p.moveTo(cx + r, cy)
    p.cubicTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r)
    p.cubicTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy)
    p.cubicTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r)
    p.cubicTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy)
    p.close()
    return p


def stroked(d, width):
    p = from_d(d)
    p.stroke(width, LineCap.ROUND_CAP, LineJoin.ROUND_JOIN, 4)
    p.convertConicsToQuads(0.05)
    return op(p, pathops.Path(), PathOp.UNION)


def union(a, b):
    return op(a, b, PathOp.UNION)


def diff(a, b):
    return op(a, b, PathOp.DIFFERENCE)


def inter(a, b):
    return op(a, b, PathOp.INTERSECTION)


def brackets(inset=12, arm=40, r=16):
    """AF corner brackets around the 200x200 grid."""
    a, b = inset, 200 - inset
    return (
        f"M{a} {a + arm} V{a + r} A{r} {r} 0 0 1 {a + r} {a} H{a + arm} "
        f"M{b - arm} {a} H{b - r} A{r} {r} 0 0 1 {b} {a + r} V{a + arm} "
        f"M{b} {b - arm} V{b - r} A{r} {r} 0 0 1 {b - r} {b} H{b - arm} "
        f"M{a + arm} {b} H{a + r} A{r} {r} 0 0 1 {a} {b - r} V{b - arm}"
    )


# ---------------------------------------------------------------- the butte


def skyline(eps):
    raw = {}
    for line in (HERE / "skyline.txt").read_text().split("\n"):
        if line.strip():
            x, y = line.split()
            raw[int(x)] = int(y)
    pts = []
    for x in range(min(raw) + 10, max(raw) - 9, 2):
        pts.append((x, statistics.median(raw[i] for i in range(x - 3, x + 4))))
    return rdp(pts, eps)


def rdp(p, eps):
    """Ramer-Douglas-Peucker: drop points closer than eps to the line."""
    if len(p) < 3:
        return p
    (x1, y1), (x2, y2) = p[0], p[-1]
    dx, dy = x2 - x1, y2 - y1
    length = (dx * dx + dy * dy) ** 0.5
    dmax, idx = 0, 0
    for i in range(1, len(p) - 1):
        d = abs(dy * p[i][0] - dx * p[i][1] + x2 * y1 - y2 * x1) / length
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(p[: idx + 1], eps)[:-1] + rdp(p[idx:], eps)
    return [p[0], p[-1]]


def catmull(p, t=0.5):
    """Smooth curve through the points (Catmull-Rom as cubic Béziers)."""
    d = f"M{fmt(p[0][0])} {fmt(p[0][1])}"
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3)
        d += " C" + " ".join(fmt(v) for v in (*c1, *c2, *p2))
    return d


def butte(scale=0.4, corner_x=128, top=60, lift=1.3, eps=1.8):
    """The butte as a closed path on the 200 grid.

    scale: grid units per photo pixel. corner_x: where the crown's square
    north-east corner (photo x 905) lands. top: grid y of the summit. lift:
    vertical stretch, like a long lens from town.
    """
    cx = 905 - (corner_x - 100) / scale
    g = [(100 + (x - cx) * scale, top + (y - 204) * scale * lift) for x, y in skyline(eps)]
    return catmull(g) + f" L{fmt(g[-1][0])} 220 L{fmt(g[0][0])} 220 Z"


def mark_shapes(ring=True, r=66, bracket_w=10, butte_d=None):
    """(brackets, lens, butte) as flattened paths on a 200x200 grid."""
    lens = circle(100, 100, r)
    sil = inter(from_d(butte_d or butte()), lens)
    sky = diff(lens, sil)
    if ring:
        sky = union(sky, diff(circle(100, 100, r + 10), circle(100, 100, r + 6)))
    return stroked(brackets(), bracket_w), sky, sil


# ---------------------------------------------------------------- type

FONTS = {
    "sans": ROOT / "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
    "mono": ROOT / "node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
}


@lru_cache(None)
def font(family, weight):
    f = TTFont(FONTS[family])
    f.flavor = None
    buf = io.BytesIO()
    instantiateVariableFont(f, {"wght": weight}).save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


def cap_height(family, weight, size):
    f, _ = font(family, weight)
    return f["OS/2"].sCapHeight * size / f["head"].unitsPerEm


def set_text(text, family, weight, size, tracking=0.0, x=0.0, y=0.0):
    """Shape text with HarfBuzz and return (path d, advance). y is the baseline; tracking in em."""
    f, data = font(family, weight)
    upm = f["head"].unitsPerEm
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb.Font(hb.Face(hb.Blob(data))), buf, {"kern": True, "liga": False})
    glyphs, order, s = f.getGlyphSet(), f.getGlyphOrder(), size / upm
    pen_x, parts = 0.0, []
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        pen = SVGPathPen(glyphs, fmt)
        glyphs[order[info.codepoint]].draw(
            TransformPen(pen, (s, 0, 0, -s, x + (pen_x + pos.x_offset) * s, y - pos.y_offset * s))
        )
        if pen.getCommands():
            parts.append(pen.getCommands())
        pen_x += pos.x_advance + (tracking * upm if i < len(buf.glyph_infos) - 1 else 0)
    return " ".join(parts), pen_x * s


# ---------------------------------------------------------------- outputs


def svg(view, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img"><title>{title}</title>{body}</svg>\n'


def mark_body(frame, sky, sil):
    f, s, b = mark_shapes()
    out = f'<path fill="{frame}" d="{to_d(f)}"/>'
    if sil:
        out += f'<path fill="{sil}" d="{to_d(b)}"/>'
    return out + f'<path fill="{sky}" d="{to_d(s)}"/>'


def mark(frame=BONE, sky=AMBER, sil=BUTTE):
    return svg("0 0 200 200", mark_body(frame, sky, sil), "Thumb Butte logo mark")


def icon():
    """Favicon: no ring, heavier brackets, butte set lower so there's sky around it at 16px."""
    f, s, b = mark_shapes(ring=False, r=60, bracket_w=16, butte_d=butte(corner_x=126, top=84, eps=2.4))
    body = (
        f'<rect x="-14" y="-14" width="228" height="228" rx="48" fill="{INK}"/>'
        f'<path fill="{BONE}" d="{to_d(f)}"/><path fill="{AMBER}" d="{to_d(s)}"/><path fill="{BONE}" d="{to_d(b)}"/>'
    )
    return svg("-14 -14 228 228", body, "Michael Rubi Photography")


def lockup(name, sub, frame=BONE, sky=AMBER, sil=BUTTE, name_fill=BONE, sub_fill=AMBER, stacked=False):
    """Mark plus name; the mono sub line is tracked out to the name's width."""
    name_size, sub_size, gap = 84, 25, 22
    _, nw = set_text(name, "sans", 600, name_size, -0.035)
    _, sw = set_text(sub, "mono", 500, sub_size)
    track = min(max((nw - sw) / (len(sub) - 1) / sub_size, 0.08), 0.32)
    _, sw = set_text(sub, "mono", 500, sub_size, track)
    width = max(nw, sw)
    ch_name, ch_sub = cap_height("sans", 600, name_size), cap_height("mono", 500, sub_size)
    m = mark_body(frame, sky, sil)
    if stacked:
        W = max(width, 200)
        base = 244 + ch_name
        name_d, _ = set_text(name, "sans", 600, name_size, -0.035, (W - nw) / 2, base)
        sub_d, _ = set_text(sub, "mono", 500, sub_size, track, (W - sw) / 2, base + gap + ch_sub)
        body = f'<g transform="translate({fmt((W - 200) / 2)} 0)">{m}</g>'
        view = f"0 0 {fmt(W)} {fmt(base + gap + ch_sub)}"
    else:
        top = 100 - (ch_name + gap + ch_sub) / 2
        name_d, _ = set_text(name, "sans", 600, name_size, -0.035, 236, top + ch_name)
        sub_d, _ = set_text(sub, "mono", 500, sub_size, track, 236, top + ch_name + gap + ch_sub)
        body = m
        view = f"0 0 {fmt(236 + width)} 200"
    body += f'<path fill="{name_fill}" d="{name_d}"/><path fill="{sub_fill}" d="{sub_d}"/>'
    return svg(view, body, f"{name} {sub.title()}")


NAMES = {
    "michael-rubi": ("Michael Rubi", "PHOTOGRAPHY · PRESCOTT AZ"),
    "prescott-photos": ("Prescott Photos", "BY MICHAEL RUBI"),
}
PAPER = dict(frame=INK, sky=AMBER, sil=INK, name_fill=INK, sub_fill=AMBER_PAPER)


def main():
    files = {
        "mark.svg": mark(),
        "mark-light.svg": mark(frame=INK, sil=INK),
        "mark-black.svg": mark(frame=INK, sky=INK, sil=None),
        "mark-white.svg": mark(frame="#ffffff", sky="#ffffff", sil=None),
        "icon.svg": icon(),
    }
    for slug, (name, sub) in NAMES.items():
        files[f"lockup-{slug}.svg"] = lockup(name, sub)
        files[f"lockup-{slug}-light.svg"] = lockup(name, sub, **PAPER)
        files[f"stacked-{slug}.svg"] = lockup(name, sub, stacked=True)
        files[f"stacked-{slug}-light.svg"] = lockup(name, sub, stacked=True, **PAPER)
    for fname, content in files.items():
        (ROOT / "brand" / fname).write_text(content)
    (ROOT / "static/favicon.svg").write_text(files["icon.svg"])

    f, s, b = mark_shapes()
    paths = {"brackets": to_d(f), "sky": to_d(s), "butte": to_d(b)}
    (ROOT / "src/lib/brand").mkdir(exist_ok=True)
    body = json.dumps(paths, indent="\t")
    (ROOT / "src/lib/brand/mark.ts").write_text(
        "// Generated by brand/generator/build.py. Don't edit by hand.\n"
        "// Thumb Butte logo mark on a 200x200 grid.\n"
        f"export const mark = {body} as const;\n"
    )
    print(f"wrote {len(files)} brand files, static/favicon.svg, src/lib/brand/mark.ts")


if __name__ == "__main__":
    main()
