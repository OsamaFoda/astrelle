"""Draws Astrelle's own wallpaper from its four icons: the aurora's curtains as waves across the
sky over its hills, the eclipse as the sun or moon, a shower of comets, the galaxy, and stars.
The icons' drawings are taken from their files (ui/icons/), so the wallpaper always matches them.

    python3 branding-src/wallpaper.py ui/icons /tmp/astrelle.svg
    magick -background none -density 192 /tmp/astrelle.svg -crop 3840x2160+480+0 +repage \
        -quality 90 ui/wallpapers/astrelle.jpg

(Rendered at twice its size, 4K, less PAD on each side.) Astrelle shows it as its default
wallpaper (scripts/wallpaper.mjs).
"""
import math
import random
import re
import sys

W, H = 1920, 1080
# Drawn this much wider on each side, then cropped: a blur reaching the edge of the drawing fades
# out there, which would show at the edges of the screen.
PAD = 240
SKIP_DEFS = {"bg", "edge", "sheen", "tile"}


def part(icons, name, prefix):
    """An icon's drawing without its tile: its own defs (ids prefixed, so icons don't clash), and
    what's drawn over the night sky, less the sky, its stars and the glassy sheen."""
    s = open(f"{icons}/{name}.svg").read()
    defs = s[s.index("<defs>") + 6:s.index("</defs>")]
    kept = []
    for m in re.finditer(r"\s*<(linearGradient|radialGradient|filter|clipPath|mask)\b.*?</\1>", defs, re.S):
        ident = re.search(r'id="([^"]+)"', m.group(0)).group(1)
        if ident not in SKIP_DEFS:
            kept.append(m.group(0).strip())
    body = s[s.index('<g clip-path="url(#tile)">') + len('<g clip-path="url(#tile)">'):]
    body = body[:body.rindex("</g>")]
    lines = [l for l in body.splitlines() if l.strip()
             and 'url(#bg)' not in l and 'url(#sheen)' not in l
             and not re.search(r'<circle [^>]*r="(1\.6|2\.2|3)" fill="#fff" opacity', l)]
    defs_text, body_text = "\n".join(kept), "\n".join(lines)
    for ident in set(re.findall(r'id="([^"]+)"', defs_text)):
        for old, new in ((f'id="{ident}"', f'id="{prefix}{ident}"'), (f"url(#{ident})", f"url(#{prefix}{ident})"),
                         (f'href="#{ident}"', f'href="#{prefix}{ident}"')):
            defs_text, body_text = defs_text.replace(old, new), body_text.replace(old, new)
    return defs_text, body_text


def stars(rng, n):
    out = []
    for _ in range(n):
        x, y = rng.uniform(0, W), rng.uniform(0, H * 0.82) ** 1.0
        # Fewer towards the horizon, where the aurora glows.
        if rng.random() < y / H * 0.9:
            continue
        r = rng.choice([0.7, 0.9, 1.1, 1.3, 1.6, 2.0])
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#fff" opacity="{rng.uniform(.35, .95):.2f}"/>')
    # A few bright ones, with the icons' cross of light.
    for _ in range(9):
        x, y = rng.uniform(60, W - 60), rng.uniform(40, H * 0.55)
        a = rng.uniform(14, 26)
        out.append(f'<g opacity="{rng.uniform(.6, .9):.2f}"><circle cx="{x:.0f}" cy="{y:.0f}" r="{a * .45:.0f}" fill="#c7d2fe" opacity=".35" filter="url(#w-glow)"/>'
                   f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{a:.0f}" ry="1.2" fill="#fff"/><ellipse cx="{x:.0f}" cy="{y:.0f}" rx="1.2" ry="{a * .8:.0f}" fill="#fff"/>'
                   f'<circle cx="{x:.0f}" cy="{y:.0f}" r="2.2" fill="#fff"/></g>')
    return "\n".join(out)


def main(icons, out):
    rng = random.Random(7)
    a_defs, aurora = part(icons, "aurora", "a-")
    e_defs, eclipse = part(icons, "eclipse", "e-")
    c_defs, comet = part(icons, "comet", "c-")
    g_defs, galaxy = part(icons, "galaxy", "g-")
    # The aurora's hills, the ground the sky sits over, are drawn once, below its curtains.
    ground = next(l for l in aurora.splitlines() if "url(#a-ground)" in l)
    curtains = aurora.replace(ground, "")
    comets = [  # (x, y of the head, size): falling the same way, as a shower does
        (1180, 150, .62), (1290, 420, .34), (930, 70, .30), (1520, 560, .22), (720, 250, .2),
    ]
    shower = "\n".join(
        f'<g transform="translate({x} {y}) scale({s}) translate(-346 -166)" opacity="{.95 if s > .5 else .8}">{comet}</g>'
        for x, y, s in comets)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-PAD} 0 {W + 2 * PAD} {H}" width="{W + 2 * PAD}" height="{H}">
  <!-- Astrelle's wallpaper: its four icons as one night sky. Drawn by wallpaper.py from ui/icons/. -->
  <defs>
    <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05060f"/>
      <stop offset=".45" stop-color="#0a0d22"/>
      <stop offset=".8" stop-color="#101633"/>
      <stop offset="1" stop-color="#050611"/>
    </linearGradient>
    <radialGradient id="w-haze" cx=".5" cy="1" r=".75">
      <stop offset="0" stop-color="#2dd4bf" stop-opacity=".16"/>
      <stop offset=".55" stop-color="#6366f1" stop-opacity=".07"/>
      <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <filter id="w-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
    {a_defs}
    {e_defs}
    {c_defs}
    {g_defs}
  </defs>
  <rect x="{-PAD}" width="{W + 2 * PAD}" height="{H}" fill="url(#w-sky)"/>
  <rect width="{W}" height="{H}" fill="url(#w-haze)"/>
  {stars(rng, 520)}
  <!-- The galaxy, far off. -->
  <g transform="translate(330 215) scale(.62) translate(-256 -256)" opacity=".9">{galaxy}</g>
  <!-- The eclipse, the sun or moon. -->
  <g transform="translate(1600 210) scale(.78) translate(-256 -256)">{eclipse}</g>
  <!-- The comets, a shower. -->
  {shower}
  <!-- The aurora: its curtains, stretched into waves across the sky, over its hills. -->
  <g transform="translate(-560 300) scale(5.8 2.05) translate(-20 -50)" opacity=".9">{curtains}</g>
  <g transform="translate(-60 120) scale(4.15 2.2) translate(-20 0)">{ground}</g>
</svg>
'''
    open(out, "w").write(svg)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
