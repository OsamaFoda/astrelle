// Closing the last tab of a workspace keeps the window (even with "close Astrelle with the last
// tab" on) and leaves a new tab in that workspace; the other workspaces' tabs are untouched.
// A tab group shows only in the workspaces that have its tabs.
const wait = ms => new Promise(r => setTimeout(r, ms));
const W = window.aetherWorkspaces;
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "b", name: "Study" }]));
Services.prefs.setBoolPref("browser.tabs.closeWindowWithLastTab", true);
await wait(300);
const grouped = gBrowser.addTrustedTab("about:mozilla");
gBrowser.addTrustedTab("about:robots");
await wait(300);
const group = gBrowser.addTabGroup([grouped], { label: "G", insertBefore: grouped });
const mainTabs = gBrowser.tabs.length;
W.switchTo("b");
await wait(500);
const groupHiddenElsewhere = group.hidden;
gBrowser.removeCurrentTab();
await wait(800);
const windowKept = !window.closed;
const left = gBrowser.visibleTabs.filter(t => !t.pinned);
const newTabInStudy = W.active() === "b" && left.length === 1 && W.workspaceOf(left[0]) === "b";
const mainIntact = gBrowser.tabs.filter(t => W.workspaceOf(t) === "home").length === mainTabs;
W.switchTo("home");
await wait(300);
const groupShownAtHome = !group.hidden;
// A Study tab joining the group shows it in Study too.
W.switchTo("b");
await wait(300);
group.addTabs?.([gBrowser.selectedTab]);
await wait(300);
const groupShownOnceItHasStudyTab = !group.hidden;
Services.prefs.clearUserPref("browser.tabs.closeWindowWithLastTab");
return {
  ok: groupHiddenElsewhere && windowKept && newTabInStudy && mainIntact && groupShownAtHome && groupShownOnceItHasStudyTab,
  groupHiddenElsewhere, windowKept, newTabInStudy, mainIntact, groupShownAtHome, groupShownOnceItHasStudyTab,
};
