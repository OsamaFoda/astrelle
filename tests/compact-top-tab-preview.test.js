// timeout: 60
// Tabs on top, compact mode: after the tabs have been hovered and one clicked, the toolbar hides
// once the mouse goes to the page. Firefox's tab preview, moving from tab to tab, leaves the tab
// it left marked open="true", which mustn't count as a menu open from the toolbar.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
Services.prefs.setBoolPref("sidebar.verticalTabs", false);
Services.prefs.setBoolPref("aether.compactMode", true);
gBrowser.selectedTab = gBrowser.addTrustedTab("about:mozilla");
gBrowser.addTrustedTab("about:robots");
const toolbox = document.getElementById("navigator-toolbox");
const out = {};
for (const reveal of ["over", "push"]) {
  Services.prefs.setStringPref("aether.compactReveal", reveal);
  move(innerWidth / 2, innerHeight / 2); await wait(1500);
  move(innerWidth / 2, 2); await wait(400); move(innerWidth / 2, 40); await wait(900);
  const shown = toolbox.getBoundingClientRect().bottom > 40;
  const tab = gBrowser.tabs[1], r = tab.getBoundingClientRect();
  move(r.left + r.width / 2, r.top + r.height / 2);
  synthesizeMouseEvent("mousedown", r.left + r.width / 2, r.top + r.height / 2, {});
  synthesizeMouseEvent("mouseup", r.left + r.width / 2, r.top + r.height / 2, {});
  await wait(400);
  gBrowser.tabs[2].setAttribute("open", "true"); // as the preview leaves it, whether or not it showed here
  move(innerWidth / 2, innerHeight / 2); await wait(300); move(innerWidth / 2 + 20, innerHeight / 2 + 20); await wait(1500);
  out[reveal] = { shown, hidden: toolbox.getBoundingClientRect().bottom <= 8 };
  gBrowser.tabs[2].removeAttribute("open");
}
for (const p of ["sidebar.verticalTabs", "aether.compactMode", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
return { ok: Object.values(out).every(o => o.shown && o.hidden), ...out };
