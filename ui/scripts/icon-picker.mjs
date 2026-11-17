// The app icon choices on the welcome and in Astrelle Settings: a card for each icon (Eclipse,
// Aurora, Comet, Galaxy) with a dropdown for its colours (Original, Nightfall, Sunrise). The
// card's button carries the icon in the colours its dropdown shows, so the page's own choice
// handling (a click chooses data-value; the one matching the pref is pressed) works as for any
// choice; choosing colours chooses that icon in them. Kept in step with the pref, which other
// windows and pages change too.

import { COLOURWAYS, chosen, iconURL, nameOf } from "./app-icon.mjs";

const PREF = "aether.appIcon";

export function setUpIconPicker(doc, win) {
  const cards = [...doc.querySelectorAll(".app-icon-card")];
  const show = (card, colours) => {
    const name = nameOf(card.dataset.shape, colours);
    const button = card.querySelector(".app-icon");
    button.dataset.value = name;
    card.querySelector("img").src = iconURL(name);
    card.querySelector("select").value = colours;
  };
  // The chosen icon's card shows it in its colours; the others keep what they showed.
  const sync = () => {
    const name = chosen();
    for (const card of cards) {
      const shape = card.dataset.shape;
      if (name === shape || name.startsWith(`${shape}-`)) show(card, name === shape ? "original" : name.slice(shape.length + 1));
      const button = card.querySelector(".app-icon");
      button.setAttribute("aria-pressed", button.dataset.value === name);
    }
  };
  for (const card of cards) {
    const select = card.querySelector("select");
    select.addEventListener("change", () => {
      if (!COLOURWAYS.includes(select.value)) return;
      show(card, select.value);
      Services.prefs.setStringPref(PREF, card.querySelector(".app-icon").dataset.value);
    });
  }
  Services.prefs.addObserver(PREF, sync);
  win.addEventListener("unload", () => Services.prefs.removeObserver(PREF, sync), { once: true });
  sync();
}
