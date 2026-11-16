// timeout: 60
// Compact mode's bars slide as one: partway out, the address bar is exactly as far along as the
// sidebar (or toolbar) it rides on, and with tabs on top the page comes down with the toolbar.
// (They used to travel different distances in the same time, so the address bar trailed by up to
// 16 px and the gap to the page opened and closed on the way.)
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
Services.prefs.setBoolPref("aether.compactMode", true);
gBrowser.selectedTab = gBrowser.addTrustedTab("about:license");
const out = {};
for (const vertical of [true, false]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  move(innerWidth / 2, innerHeight / 2);
  await wait(1500);
  const parts = vertical ? ["sidebar-container", "navigator-toolbox", "urlbar"] : ["navigator-toolbox", "urlbar", "tabbrowser-tabbox"];
  const edge = id => { const r = document.getElementById(id).getBoundingClientRect(); return vertical ? r.left : r.top; };
  const rest = parts.map(edge);
  move(vertical ? 2 : innerWidth / 2, vertical ? innerHeight / 2 : 2);
  await new Promise(r => requestAnimationFrame(r));
  // Freeze them partway, to compare where each one is.
  for (const a of document.getAnimations()) if (a.effect?.target && parts.includes(a.effect.target.id)) { a.pause(); a.currentTime = 90; }
  const along = parts.map((id, i) => Math.round(edge(id) - rest[i]));
  for (const a of document.getAnimations()) a.play?.();
  out[vertical ? "sidebar" : "top"] = along;
  move(innerWidth / 2, innerHeight / 2);
  await wait(1200);
}
Services.prefs.clearUserPref("sidebar.verticalTabs");
const together = list => list[0] !== 0 && list.every(v => Math.abs(v - list[0]) <= 1);
return { ok: together(out.sidebar) && together(out.top), ...out };
