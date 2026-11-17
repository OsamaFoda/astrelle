// timeout: 90
// Every animation of the browser's own moves runs on the graphics card (moving and fading, never
// sizes), so it stays smooth however busy the page is: compact mode's bars coming and going (in
// the sidebar over the page or beside it, and with tabs on top), a sidebar panel opening and
// closing, and the highlight sliding between tabs.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
// The animations running in the window now, as "what: where", and whether all are on the card.
// (Not the switching on and off of something's visibility after a pause: no motion, no frames.)
const running = () => document.getAnimations()
  .filter(a => a.playState === "running" && a.transitionProperty !== "visibility")
  .map(a => `${a.effect?.target?.id || a.effect?.target?.localName}${a.effect?.pseudoElement || ""} ${a.transitionProperty || a.id || a.animationName}: ${a.isRunningOnCompositor ? "card" : "MAIN"}`);
const out = {};
gBrowser.selectedTab = gBrowser.addTrustedTab("about:mozilla");
gBrowser.addTrustedTab("about:robots");
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.setBoolPref("aether.compactMode", true);
for (const [vertical, reveal] of [[true, "over"], [true, "push"], [false, "push"]]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  Services.prefs.setStringPref("aether.compactReveal", reveal);
  move(innerWidth / 2, innerHeight / 2); await wait(1500);
  move(vertical ? 2 : innerWidth / 2, vertical ? innerHeight / 2 : 2);
  await wait(120);
  const coming = running();
  move(vertical ? 100 : innerWidth / 2, vertical ? innerHeight / 2 : 40); await wait(900);
  move(innerWidth / 2, innerHeight / 2);
  await wait(260); // the pause before they go, then the slide
  out[`compact ${vertical ? "sidebar" : "top"} ${reveal}`] = [...coming, ...running()];
}
Services.prefs.clearUserPref("aether.compactMode");
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
await wait(1200);
SidebarController.show("viewHistorySidebar");
await wait(100);
out["panel opening"] = running();
await wait(1500);
SidebarController.hide();
await wait(100);
out["panel closing"] = running();
await wait(1000);
gBrowser.selectedTab = gBrowser.tabs[1];
await wait(60);
out["tab highlight"] = running();
for (const p of ["aether.liquidGlass", "sidebar.verticalTabs", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
const ok = Object.values(out).every(list => list.length > 0 && list.every(a => a.endsWith("card")));
return { ok, ...out };
