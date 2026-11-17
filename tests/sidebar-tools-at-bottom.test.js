// timeout: 60
// With tabs in the sidebar, its top has the navigation buttons and the address bar (full width),
// then the tabs; then workspaces ("+" and any to switch between), just above the line over the
// sidebar's own tools (settings, history, bookmarks); under it all, the toolbar's tools: the
// add-on buttons, Split View, Compact Mode and the menu. Workspaces take clicks there. Nothing reaches past the sidebar's edge, even with more buttons than fit in a row (they
// wrap, each row on its own).
// Between them the tabs take the clicks, not the toolbar over them. With tabs on top, the same
// buttons are one row, as before. In compact mode the tools slide away and back with the sidebar.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const rect = id => document.getElementById(id).getBoundingClientRect();
const TOOLS = ["unified-extensions-button", "aether-split-view", "aether-compact-mode", "PanelUI-button"];
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
// More buttons than fit: some by the navigation ones, as Firefox adds Downloads after a download.
const EXTRA = ["downloads-button", "print-button", "history-panelmenu", "fullscreen-button"];
for (const id of EXTRA) CustomizableUI.addWidgetToArea(id, "nav-bar");
await wait(1500);
const sidebar = rect("sidebar-container"), tabs = rect("tabbrowser-tabs"), urlbar = rect("urlbar-container");
const inside = [...document.querySelectorAll("#nav-bar > *, #nav-bar-customization-target > *")]
  .filter(el => el.checkVisibility()).map(el => [el.id, el.getBoundingClientRect()]);
const out = {
  topFirst: rect("back-button").top < urlbar.top && urlbar.bottom <= tabs.top + 1,
  urlbarFull: urlbar.width > sidebar.width - 24 && urlbar.right <= sidebar.right,
  toolsAtBottom: TOOLS.every(id => rect(id).bottom > sidebar.bottom - 50 && rect(id).top >= tabs.bottom),
  toolsInARow: new Set(TOOLS.map(id => Math.round(rect(id).top))).size === 1,
  nothingPastTheEdge: inside.filter(([, r]) => r.right > sidebar.right + 1 || r.left < sidebar.left - 1).map(([id]) => id),
};
out.allInside = out.nothingPastTheEdge.length === 0;
const line = document.querySelector("sidebar-main").shadowRoot.querySelector("#sidebar-tools-and-extensions-splitter").getBoundingClientRect();
const ws = rect("aether-workspaces");
out.workspacesAboveTheLine = ws.top >= tabs.bottom - 1 && ws.bottom <= line.top && line.top - ws.bottom < 12 && TOOLS.every(id => rect(id).top > line.bottom);
out.workspacesClickable = !!document.elementFromPoint(ws.left + 10, ws.top + ws.height / 2)?.closest("#aether-workspaces");
const middle = document.elementFromPoint(sidebar.left + sidebar.width / 2, (tabs.top + tabs.bottom) / 2);
out.middleIsTabs = !middle.closest("#navigator-toolbox") && !!middle.closest("#sidebar-container");
// Compact mode: away with the sidebar, and back with it.
Services.prefs.setBoolPref("aether.compactMode", true);
move(innerWidth / 2, innerHeight / 2);
await wait(1500);
out.compactHidden = TOOLS.every(id => rect(id).right <= 8);
move(2, innerHeight / 2); await wait(400); move(100, innerHeight / 2); await wait(900);
out.compactBack = TOOLS.every(id => rect(id).left >= 0 && rect(id).bottom > innerHeight - 60);
Services.prefs.clearUserPref("aether.compactMode");
move(innerWidth / 2, innerHeight / 2);
// Tabs on top: one row again, everything where it was.
Services.prefs.setBoolPref("sidebar.verticalTabs", false);
await wait(1500);
const row = Math.round(rect("urlbar-container").top);
out.topOneRow = [...TOOLS, "back-button"].every(id => Math.abs(Math.round(rect(id).top) - row) < 8);
out.topNoBottom = document.documentElement.style.getPropertyValue("--aether-toolbox-bottom") === "0px";
Services.prefs.clearUserPref("sidebar.verticalTabs");
for (const id of EXTRA) CustomizableUI.removeWidgetFromArea(id);
const { nothingPastTheEdge, ...checks } = out;
return { ok: Object.values(checks).every(Boolean), ...out };
