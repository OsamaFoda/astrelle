// Moving one tab of a split view to another workspace moves the whole split view there.
const wait = ms => new Promise(r => setTimeout(r, ms));
const W = window.aetherWorkspaces;
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "b", name: "Study" }]));
await wait(300);
const a = gBrowser.addTrustedTab("about:license");
gBrowser.selectedTab = a;
await wait(300);
BrowserCommands.addTabSplitView();
await wait(800);
const pair = [...(gBrowser.selectedTab.splitview?.tabs ?? [])];
W.moveTabs([a], "b");
await wait(800);
const where = pair.map(t => W.workspaceOf(t));
return { ok: pair.length === 2 && where.every(ws => ws === "b") && pair.every(t => t.hidden), where };
