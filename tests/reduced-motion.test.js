// timeout: 60
// With the system set to reduce motion, Astrelle's springs, swells, slides and scales stop (Peek,
// compact mode's bars, the address bar, toolbar buttons, New Tab's shortcuts); colours and fades
// may stay.
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setIntPref("ui.prefersReducedMotion", 1);
await wait(1000);
const MOVING = /transform|translate|margin|scale|width|aether-peek-in|left|right|top|bottom/;
const moving = new Set();
const record = doc => {
  for (const a of doc.getAnimations({ subtree: true })) {
    const name = a.animationName || a.transitionProperty || "";
    if ((a.effect?.getComputedTiming?.().endTime ?? 0) > 20 && MOVING.test(name)) moving.add(`${name} on ${a.effect.target?.id || a.effect.target?.className || a.effect.target?.localName}`);
  }
};
const step = async (doc, action) => { action(); for (let i = 0; i < 8; i++) { record(doc); await wait(25); } await wait(400); };
await step(document, () => window.aetherPeek.open("about:blank"));
await step(document, () => window.aetherPeek.close());
await step(document, () => Services.prefs.setBoolPref("aether.compactMode", true));
await step(document, () => Services.prefs.setBoolPref("aether.compactMode", false));
await step(document, () => gURLBar.focus());
BrowserCommands.openTab();
await wait(1500);
const page = gBrowser.selectedBrowser.contentDocument;
const tile = page.querySelector("a, button");
await step(page, () => tile?.dispatchEvent(new page.defaultView.MouseEvent("mouseover", { bubbles: true })));
Services.prefs.clearUserPref("ui.prefersReducedMotion");
return { ok: moving.size === 0, moving: [...moving] };
