// timeout: 60
// Frosted Glass, compact mode set to Hover: the sidebar (or the top toolbar) hovering over the page
// shows the page frosted behind it (a small snapshot of the part under it, stretched back out;
// scripts/hover-glass.mjs), placed where that part is. Set to Slide, the wallpaper is behind it and
// its own glass blurs that: no snapshot.
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
move(innerWidth / 2, innerHeight / 2);
for (const p of ["aether.liquidGlass", "aether.compactMode", "sidebar.verticalTabs", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
const ok = out["sidebar over"].frosted && out["top over"].frosted && out["top over"].at === "8px 8px" && !out["sidebar push"].frosted;
return { ok, ...out };
