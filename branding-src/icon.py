"""Draws Astrelle's icon: the Aurora Sunrise scene (icons/aurora-sunrise.svg) with a frosted-glass
"a" in front of it, as the browser's own Frosted Glass sits over a wallpaper. The glass shows the
scene behind it blurred, warmed and lightened; a rim catches light from the top left; a soft
shadow lifts the letter off the scene. The letter is one outline (so the glass shows no seams),
its stem's foot cut at an angle.

    python3 branding-src/icon.py            (writes ui/icons/astrelle.svg; then render.py)
"""
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.join(HERE, "icons", "aurora-sunrise.svg")
OUT = os.path.join(HERE, "..", "ui", "icons", "astrelle.svg")

# The letter: its bowl's centre and outer and inner radii, and how far the stem's foot rises.
CX, CY, R, r, FOOT = 238, 262, 150, 78, 30


def letter():
    """The a as one outline: down the stem's right side, across its slanted foot, up its inner
    side to where the bowl meets it, round the outside of the bowl, back to the stem; the hole
    (the counter) cut out."""
    sx, h = CX + r, math.sqrt(R * R - r * r)
    outline = (f"M {sx} {CY - R} L {CX + R} {CY - R} L {CX + R} {CY + R - FOOT} L {sx} {CY + R} "
               f"L {sx} {CY + h:.2f} A {R} {R} 0 1 1 {sx} {CY - h:.2f} Z")
    counter = f"M {CX - r} {CY} A {r} {r} 0 1 0 {CX + r} {CY} A {r} {r} 0 1 0 {CX - r} {CY} Z"
    return f"{outline} {counter}"


def scene():
    """The scene's defs and drawing, its ids prefixed so they can't clash with the icon's own."""
    s = open(SCENE).read()
    for ident in set(re.findall(r'id="([^"]+)"', s)):
        s = s.replace(f'id="{ident}"', f'id="s-{ident}"').replace(f"url(#{ident})", f"url(#s-{ident})")
    defs = s[s.index("<defs>") + 6:s.index("</defs>")]
    body = s[s.index("</defs>") + 7:s.rindex("</svg>")]
    return defs, body


def icon():
    defs, body = scene()
    a = letter()
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <!-- Astrelle's icon: the Aurora Sunrise scene, a frosted-glass "a" in front of it. Drawn by branding-src/icon.py. -->
  <defs>{defs}
    <g id="scene">{body}</g>
    <mask id="a"><rect width="512" height="512" fill="#000"/><path d="{a}" fill-rule="evenodd" fill="#fff"/></mask>
    <filter id="frost" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="11"/><feColorMatrix type="saturate" values="1.25"/></filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="rim"><feMorphology in="SourceAlpha" operator="erode" radius="3" result="inner"/><feComposite in="SourceGraphic" in2="inner" operator="out"/></filter>
    <linearGradient id="rimlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf2"/><stop offset=".55" stop-color="#ffe7c7" stop-opacity=".4"/><stop offset="1" stop-color="#fff3e2" stop-opacity=".8"/>
    </linearGradient>
    <clipPath id="tile"><rect x="32" y="32" width="448" height="448" rx="108"/></clipPath>
  </defs>
  <use href="#scene" xlink:href="#scene"/>
  <g clip-path="url(#tile)"><g opacity=".32" filter="url(#shadow)" transform="translate(0 10)"><path d="{a}" fill-rule="evenodd" fill="#1a0a06"/></g></g>
  <g mask="url(#a)"><g filter="url(#frost)"><use href="#scene" xlink:href="#scene"/></g><rect width="512" height="512" fill="#fff1de" opacity=".26"/></g>
  <g filter="url(#rim)"><path d="{a}" fill-rule="evenodd" fill="url(#rimlight)"/></g>
</svg>
'''


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w").write(icon())
