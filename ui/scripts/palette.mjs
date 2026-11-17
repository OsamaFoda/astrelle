// Applies the chosen colour theme (the aether.palette pref; the colours are in styles/palettes.css)
// to browser windows, and, through follow(), to Astrelle's own pages like the new tab page.

export const PALETTES = ["nebula", "ocean", "aurora", "sunset", "rose", "graphite"];
export const DEFAULT_PALETTE = "sunset"; // orange, as Astrelle's icon
const PREF = "aether.palette";

// Keeps a document's colour theme in step with the pref until its window closes.
export function follow(doc, win) {
  const update = () => {
    const name = Services.prefs.getStringPref(PREF, DEFAULT_PALETTE);
    doc.documentElement.setAttribute("aether-palette", PALETTES.includes(name) ? name : DEFAULT_PALETTE);
  };
  Services.prefs.addObserver(PREF, update);
  win.addEventListener("unload", () => Services.prefs.removeObserver(PREF, update), { once: true });
  update();
}

export function init(win) {
  follow(win.document, win);
}
