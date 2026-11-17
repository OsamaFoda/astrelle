// timeout: 60
// Frosted Glass, compact mode set to Hover: the sidebar (or the top toolbar) hovering over the page
// shows the page frosted behind it (a small snapshot of the part under it, stretched back out;
// scripts/hover-glass.mjs), placed where that part is. Set to Slide, the wallpaper is behind it and
// its own glass blurs that: no snapshot. Once the bar is gone, the picture is wiped from memory;
// in a private window none is taken (the hovering bar is solid).
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const root = document.documentElement;
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.setBoolPref("aether.compactMode", true);
gBrowser.selectedTab = gBrowser.addTrustedTab("about:mozilla");
const out = {};
for (const [vertical, reveal] of [[true, "over"], [false, "over"], [true, "push"]]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  Services.prefs.setStringPref("aether.compactReveal", reveal);
  root.removeAttribute("aether-hover-backdrop");
  move(innerWidth / 2, innerHeight / 2);
  await wait(1500);
  move(vertical ? 2 : innerWidth / 2, vertical ? innerHeight / 2 : 2);
  await wait(400);
  move(vertical ? 100 : innerWidth / 2, vertical ? innerHeight / 2 : 40);
  await wait(900);
  const bar = document.getElementById(vertical ? "sidebar-container" : "navigator-toolbox");
  out[`${vertical ? "sidebar" : "top"} ${reveal}`] = {
    frosted: /-moz-element/.test(getComputedStyle(bar).backgroundImage),
    at: bar.style.getPropertyValue("--aether-hover-at"),
  };
}
// Gone: wiped (the canvas emptied) within a moment.
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
Services.prefs.setStringPref("aether.compactReveal", "over");
move(innerWidth / 2, innerHeight / 2);
await wait(1500);
move(2, innerHeight / 2); await wait(400); move(100, innerHeight / 2); await wait(700);
const shownWhileOut = root.hasAttribute("aether-hover-backdrop");
move(innerWidth / 2, innerHeight / 2);
await wait(1200);
out.wipedOnceGone = shownWhileOut && !root.hasAttribute("aether-hover-backdrop");
// A private window: none taken.
const priv = OpenBrowserWindow({ private: true });
await new Promise(r => priv.addEventListener("load", r, { once: true }));
await wait(2500);
const pmove = (x, y) => priv.synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
pmove(priv.innerWidth / 2, priv.innerHeight / 2); await wait(800);
pmove(2, priv.innerHeight / 2); await wait(400); pmove(100, priv.innerHeight / 2); await wait(900);
out.privateFrosted = /-moz-element/.test(priv.getComputedStyle(priv.document.getElementById("sidebar-container")).backgroundImage)
  || priv.document.documentElement.hasAttribute("aether-hover-backdrop");
priv.close();
move(innerWidth / 2, innerHeight / 2);
for (const p of ["aether.liquidGlass", "aether.compactMode", "sidebar.verticalTabs", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
const ok = out["sidebar over"].frosted && out["top over"].frosted && out["top over"].at === "8px 8px" && !out["sidebar push"].frosted
  && out.wipedOnceGone && out.privateFrosted === false;
return { ok, ...out };
