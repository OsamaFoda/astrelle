// timeout: 60
// With tabs in the sidebar, its top has the navigation buttons, the address bar (full width) and
// workspaces, and its bottom the tools: the add-on buttons, Split View, Compact Mode and the menu.
// Between them the tabs take the clicks, not the toolbar over them. With tabs on top, the same
// buttons are one row, as before. In compact mode the tools slide away and back with the sidebar.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const rect = id => document.getElementById(id).getBoundingClientRect();
const TOOLS = ["unified-extensions-button", "aether-split-view", "aether-compact-mode", "PanelUI-button"];
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
await wait(1500);
const sidebar = rect("sidebar-container"), tabs = rect("tabbrowser-tabs"), urlbar = rect("urlbar-container");
const out = {
  topFirst: rect("back-button").top < urlbar.top && urlbar.bottom <= rect("aether-workspaces").top + 1 && rect("aether-workspaces").bottom <= tabs.top + 1,
  urlbarFull: urlbar.width > sidebar.width - 24,
  toolsAtBottom: TOOLS.every(id => rect(id).bottom > sidebar.bottom - 50 && rect(id).top >= tabs.bottom),
  toolsInARow: new Set(TOOLS.map(id => Math.round(rect(id).top))).size === 1,
};
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
return { ok: Object.values(out).every(Boolean), ...out };
