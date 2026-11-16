// A tab moved to another window: "Move to New Window" opens a window on the tab's workspace, and
// a tab dragged into a window joins the workspace that window shows (and stays visible there).
const wait = ms => new Promise(r => setTimeout(r, ms));
const W = window.aetherWorkspaces;
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "b", name: "Study" }]));
await wait(300);
W.switchTo("b");
await wait(300);
const moved = gBrowser.addTrustedTab("about:robots");
const dragged = gBrowser.addTrustedTab("about:mozilla");
await wait(500);
const win2 = gBrowser.replaceTabsWithWindow(moved);
await new Promise(r => win2.addEventListener("load", r, { once: true }));
await wait(2500);
const W2 = win2.aetherWorkspaces;
const newWindowOnStudy = W2.active() === "b" && W2.workspaceOf(win2.gBrowser.selectedTab) === "b";
// A new tab there keeps the moved one in view.
win2.BrowserCommands.openTab();
await wait(500);
const movedStillShown = win2.gBrowser.tabs.filter(t => !t.hidden).length === 2;
W2.switchTo("home");
await wait(500);
const adopted = win2.gBrowser.adoptTab(dragged, { selectTab: false });
await wait(800);
const draggedJoinsMain = W2.workspaceOf(adopted) === "home" && !adopted.hidden && W2.active() === "home";
win2.close();
return { ok: newWindowOnStudy && movedStillShown && draggedJoinsMain, newWindowOnStudy, movedStillShown, draggedJoinsMain };
