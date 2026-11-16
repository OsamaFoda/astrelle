// The sliding highlight between a pinned tab and the others, which sit in boxes of their own
// that clip their tabs: a stand-in glass makes the trip in the tab list holding both, starting
// centred on the tab you left, while the new tab's own glass waits unseen; at the end it's gone
// and the tab's glass shows. Both ways, with tabs on top and down the side.
const wait = ms => new Promise(r => setTimeout(r, ms));
const tabs = ["about:robots", "about:mozilla", "about:license", "about:logo"].map(u => gBrowser.addTrustedTab(u));
await wait(800);
gBrowser.pinTab(tabs[0]);
gBrowser.pinTab(tabs[1]);
const centre = r => [r.left + r.width / 2, r.top + r.height / 2];
const out = {};
for (const vertical of [false, true]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  await wait(1500);
  for (const [from, to] of [[tabs[1], tabs[3]], [tabs[3], tabs[1]]]) {
    gBrowser.selectedTab = from;
    await wait(1000);
    const left = centre(from.querySelector(".tab-background").getBoundingClientRect());
    gBrowser.selectedTab = to;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const lens = document.querySelector("#tabbrowser-tabs > .aether-lens");
    for (const a of lens?.getAnimations() ?? []) { a.pause(); a.currentTime = 0; }
    const startsThere = lens && centre(lens.getBoundingClientRect()).every((v, i) => Math.abs(v - left[i]) < 3);
    const ownHidden = getComputedStyle(to.querySelector(".tab-background")).opacity === "0";
    for (const a of lens?.getAnimations() ?? []) a.play();
    await wait(900);
    const landed = !document.querySelector(".aether-lens") && getComputedStyle(to.querySelector(".tab-background")).opacity === "1";
    out[`${vertical ? "sidebar" : "top"} ${from.pinned ? "from pinned" : "to pinned"}`] = { startsThere: Boolean(startsThere), ownHidden, landed };
  }
}
Services.prefs.clearUserPref("sidebar.verticalTabs");
return { ok: Object.values(out).every(r => r.startsThere && r.ownHidden && r.landed), ...out };
