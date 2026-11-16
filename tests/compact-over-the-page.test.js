// timeout: 60
// Compact mode set to bring the bars out over the page (Settings: "Over the page"): the sidebar
// (or the top toolbar) comes in on top of the page, which doesn't move; set "Beside the page",
// the page moves aside as before. Settings' choice switches between them.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const tabbox = document.getElementById("tabbrowser-tabbox");
const out = {};
Services.prefs.setBoolPref("aether.compactMode", true);
for (const vertical of [true, false]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  for (const reveal of ["over", "push"]) {
    Services.prefs.setStringPref("aether.compactReveal", reveal);
    move(innerWidth / 2, innerHeight / 2);
    await wait(1200);
    const before = tabbox.getBoundingClientRect();
    if (vertical) { move(2, innerHeight / 2); await wait(600); move(100, innerHeight / 2); }
    else { move(innerWidth / 2, 2); await wait(600); move(innerWidth / 2, 40); }
    await wait(800);
    const after = tabbox.getBoundingClientRect();
    const moved = Math.round(vertical ? after.left - before.left : after.top - before.top);
    const hit = document.elementFromPoint(vertical ? 100 : innerWidth / 2, vertical ? innerHeight / 2 : 40);
    const onTop = !!hit?.closest(vertical ? "#sidebar-container, #navigator-toolbox" : "#navigator-toolbox");
    out[`${vertical ? "sidebar" : "top"} ${reveal}`] = { moved, onTop };
  }
}
move(innerWidth / 2, innerHeight / 2);
// Settings' choice
const tab = gBrowser.selectedTab = gBrowser.addTrustedTab("about:astrelle");
await wait(2000);
tab.linkedBrowser.contentDocument.querySelector('[data-pref="reveal"] [data-value="over"]').click();
await wait(300);
const chosen = Services.prefs.getStringPref("aether.compactReveal");
for (const p of ["aether.compactMode", "sidebar.verticalTabs", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
const ok = out["sidebar over"].moved === 0 && out["sidebar over"].onTop && out["sidebar push"].moved > 100 && out["sidebar push"].onTop
  && out["top over"].moved === 0 && out["top over"].onTop && out["top push"].moved > 40 && chosen === "over";
return { ok, ...out, chosen };
