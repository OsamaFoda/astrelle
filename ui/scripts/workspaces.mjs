// Workspaces: separate sets of tabs (Main, Study, …) you switch between, like Zen.
// Each tab remembers its workspace in the session, so it survives restarts; switching shows that
// workspace's tabs and hides the others. Pinned tabs are shared by every workspace. The switcher
// is a toolbar item, so it rides under the address bar in the sidebar, or sits in the top toolbar.
// Right-click a workspace to rename or delete it (its tabs move, they're never closed), and
// right-click a tab for "Move to Workspace".

const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const { SessionStore } = ChromeUtils.importESModule("resource:///modules/sessionstore/SessionStore.sys.mjs");
import { tr } from "./l10n.mjs";

const LIST = "aether.workspaces"; // [{ id, name }], shared by all windows
// Where each deleted workspace's tabs went, { deletedId: heirId }, so every window sends them to
// the same place, and so do tabs that come back later (a reopened window, the last session).
// Not "aether.workspaces.…", which the list's observer would also see.
const HEIRS = "aether.workspaceHeirs";
const KEY = "aetherWorkspace"; // session value: a tab's workspace, and a window's active one
const WIDGET = "aether-workspaces";

function workspaces() {
  let list = [];
  try {
    list = JSON.parse(Services.prefs.getStringPref(LIST, "[]"));
  } catch {}
  return list.length ? list : [{ id: "home", name: "Main" }]; // not "Home", which reads as the home button
}

function saveWorkspaces(list) {
  Services.prefs.setStringPref(LIST, JSON.stringify(list));
}

function heirs() {
  try {
    return JSON.parse(Services.prefs.getStringPref(HEIRS, "{}"));
  } catch {
    return {};
  }
}

// The workspace a saved id stands for now: itself, or the one its tabs moved to when it was
// deleted (following later deletions too), or null if there's none.
function resolve(id) {
  const known = new Set(workspaces().map(w => w.id));
  const moved = heirs();
  const seen = new Set();
  while (id && !known.has(id) && !seen.has(id)) {
    seen.add(id);
    id = moved[id];
  }
  return known.has(id) ? id : null;
}

// One widget for all windows. Windows opened later build its node before their scripts run,
// so the node starts empty and each window's controller fills it in. (getWidget can't tell if
// it exists, since it answers for any id, so creating it a second time just throws.)
try {
  CustomizableUI.createWidget({
    id: WIDGET,
    type: "custom",
    label: tr("astrelle-workspaces"),
    defaultArea: CustomizableUI.AREA_NAVBAR,
    overflows: false, // always visible, never tucked into the » menu
    onBuild(doc) {
      const item = doc.createXULElement("toolbaritem");
      item.id = WIDGET;
      item.setAttribute("label", tr("astrelle-workspaces"));
      item.setAttribute("removable", "true");
      item.setAttribute("overflows", "false"); // custom widgets don't get this from `overflows`
      // On a toolbar too narrow for them all, the wheel scrolls through them.
      item.addEventListener("wheel", event => {
        if (!event.deltaY || event.deltaX || item.scrollWidth <= item.clientWidth) return;
        item.scrollLeft += event.deltaY * (event.deltaMode ? 30 : 1);
        event.preventDefault();
      });
      doc.defaultView.aetherWorkspaces?.render(item);
      return item;
    },
  });
} catch {
  // Already created this session.
}

export function init(win) {
  const { gBrowser } = win;
  const doc = win.document;

  const active = () => resolve(SessionStore.getCustomWindowValue(win, KEY)) || workspaces()[0].id;
  const workspaceOf = tab => SessionStore.getCustomTabValue(tab, KEY) || null;
  const assign = (tab, id) => SessionStore.setCustomTabValue(tab, KEY, id);
  const tabsIn = id => gBrowser.tabs.filter(t => !t.pinned && workspaceOf(t) === id);

  // Show the active workspace's tabs and hide the rest. Tabs of a deleted workspace join its heir,
  // and tabs with no workspace join the active one.
  function apply() {
    const current = active();
    const known = new Set(workspaces().map(w => w.id));
    for (const tab of gBrowser.tabs) {
      if (tab.pinned) continue;
      if (!known.has(workspaceOf(tab))) assign(tab, resolve(workspaceOf(tab)) || current);
      if (workspaceOf(tab) === current) gBrowser.showTab(tab);
      else if (!tab.selected) gBrowser.hideTab(tab);
    }
    // A tab group shows only in the workspaces that have its tabs: hiding its tabs leaves its name.
    for (const group of gBrowser.tabGroups ?? []) group.hidden = !group.tabs.some(tab => workspaceOf(tab) === current);
    render();
  }

  function switchTo(id) {
    if (id === active()) return;
    SessionStore.setCustomWindowValue(win, KEY, id);
    const tabs = tabsIn(id);
    tabs.forEach(t => gBrowser.showTab(t));
    // Land on the tab last used there, or a fresh new tab if the workspace is empty.
    const last = tabs.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
    if (last) gBrowser.selectedTab = last;
    else win.BrowserCommands.openTab();
    apply();
  }

  function moveTabs(tabs, id) {
    // A split view's tabs move together: half of one left behind would be hidden in its workspace.
    tabs = [...new Set(tabs.flatMap(tab => tab.splitview?.tabs ?? [tab]))];
    for (const tab of tabs) {
      if (tab.pinned) continue;
      if (tab.selected && id !== active()) {
        const next = gBrowser._findTabToBlurTo(tab, tabs);
        if (next) gBrowser.selectedTab = next;
        else win.BrowserCommands.openTab();
      }
      assign(tab, id);
    }
    apply();
  }

  function create() {
    const name = { value: "" };
    if (!Services.prompt.prompt(win, tr("astrelle-workspace-new-title"), tr("astrelle-workspace-new-prompt"), name, null, { value: false })) return;
    const label = name.value.trim();
    if (!label) return;
    const id = `ws-${Date.now().toString(36)}`;
    saveWorkspaces([...workspaces(), { id, name: label }]);
    switchTo(id);
  }

  function rename(id) {
    const name = { value: workspaces().find(w => w.id === id).name };
    if (!Services.prompt.prompt(win, tr("astrelle-workspace-rename-title"), tr("astrelle-workspace-rename-prompt"), name, null, { value: false })) return;
    if (!name.value.trim()) return;
    // Read the list again: another window may have changed it while the name was being typed.
    const list = workspaces();
    const ws = list.find(w => w.id === id);
    if (!ws) return;
    ws.name = name.value.trim();
    saveWorkspaces(list);
  }

  // Deleting moves the workspace's tabs to the first remaining one; nothing is closed.
  function remove(id) {
    const list = workspaces();
    if (list.length < 2) return;
    const heir = list.find(w => w.id !== id);
    // Its tabs move in every window, so count them all (a window still opening has none yet).
    const windows = [...Services.wm.getEnumerator("navigator:browser")];
    const count = windows.flatMap(w => w.gBrowser?.tabs ?? []).filter(t => !t.pinned && workspaceOf(t) === id).length;
    const ok = Services.prompt.confirm(win, tr("astrelle-workspace-delete-title"),
      tr("astrelle-workspace-delete-prompt", { name: list.find(w => w.id === id).name, tabs: count, heir: heir.name }));
    if (ok) deleteWorkspace(id);
  }

  function deleteWorkspace(id) {
    const rest = workspaces().filter(w => w.id !== id);
    if (!rest.length) return;
    Services.prefs.setStringPref(HEIRS, JSON.stringify({ ...heirs(), [id]: rest[0].id }));
    saveWorkspaces(rest); // every window re-applies through the pref observer
  }

  // The switcher: one button per workspace, then "+". With only one workspace there's nothing to
  // switch to, so it's just "+".
  function render(item = doc.getElementById(WIDGET)) {
    if (!item) return;
    const current = active();
    const list = workspaces();
    const buttons = list.length < 2 ? [] : list.map(ws => {
      const button = doc.createElement("button");
      button.className = "aether-ws";
      button.textContent = ws.name;
      button.title = tr("astrelle-workspace-button-title", { name: ws.name });
      button.toggleAttribute("active", ws.id === current);
      button.addEventListener("click", () => switchTo(ws.id));
      button.addEventListener("contextmenu", event => {
        event.preventDefault();
        event.stopPropagation();
        workspaceMenu(ws.id).openPopupAtScreen(event.screenX, event.screenY, true);
      });
      return button;
    });
    const add = doc.createElement("button");
    add.className = "aether-ws aether-ws-add";
    add.textContent = "+";
    add.title = tr("astrelle-workspace-add-title");
    add.addEventListener("click", create);
    item.replaceChildren(...buttons, add);
    item.toggleAttribute("several", buttons.length > 0);
    // Keep the workspace you're in scrolled into view (on a narrow top toolbar).
    const shown = buttons.find(button => button.hasAttribute("active"));
    if (shown && item.scrollWidth > item.clientWidth) {
      const left = shown.offsetLeft - item.offsetLeft;
      if (left < item.scrollLeft || left + shown.offsetWidth > item.scrollLeft + item.clientWidth) {
        item.scrollLeft = left - (item.clientWidth - shown.offsetWidth) / 2;
      }
    }
  }

  let menu = null;
  function workspaceMenu(id) {
    menu?.remove();
    menu = doc.createXULElement("menupopup");
    const item = (label, action, disabled = false) => {
      const entry = doc.createXULElement("menuitem");
      entry.setAttribute("label", label);
      if (disabled) entry.setAttribute("disabled", "true");
      entry.addEventListener("command", action);
      menu.append(entry);
    };
    item(tr("astrelle-workspace-rename"), () => rename(id));
    item(tr("astrelle-workspace-delete"), () => remove(id), workspaces().length < 2);
    doc.getElementById("mainPopupSet").append(menu);
    return menu;
  }

  // "Move to Workspace" in the tab right-click menu.
  const tabMenu = doc.getElementById("tabContextMenu");
  const moveMenu = doc.createXULElement("menu");
  moveMenu.setAttribute("label", tr("astrelle-move-to-workspace"));
  const movePopup = doc.createXULElement("menupopup");
  moveMenu.append(movePopup);
  tabMenu?.prepend(moveMenu);
  tabMenu?.addEventListener("popupshowing", event => {
    if (event.target !== tabMenu) return;
    const tab = win.TabContextMenu.contextTab;
    const tabs = tab?.multiselected ? gBrowser.selectedTabs : [tab];
    moveMenu.hidden = !tab || tab.pinned || workspaces().length < 2;
    movePopup.replaceChildren(...workspaces().filter(w => w.id !== workspaceOf(tab)).map(ws => {
      const entry = doc.createXULElement("menuitem");
      entry.setAttribute("label", ws.name);
      entry.addEventListener("command", () => moveTabs(tabs, ws.id));
      return entry;
    }));
  });

  // Closing the last tab of a workspace leaves a new tab in it, rather than Firefox's handling
  // of the last tab in a window: with "close Astrelle with the last tab" on, that would close
  // the window and every other workspace's tabs with it.
  const firefoxRemoveTab = gBrowser.removeTab;
  gBrowser.removeTab = function (tab, ...rest) {
    const elsewhere = () => this.tabs.some(t => t !== tab && !t.pinned && !t.closing && workspaceOf(t) !== active());
    if (tab && !tab.pinned && !tab.closing && tab.visible && this.visibleTabs.length === 1 && elsewhere()) {
      win.BrowserCommands.openTab();
    }
    return firefoxRemoveTab.call(this, tab, ...rest);
  };

  const container = gBrowser.tabContainer;
  // New tabs join the active workspace, and so does a tab moved here from another window: it's
  // shown where it was put.
  container.addEventListener("TabOpen", event => {
    if (!workspaceOf(event.target)) assign(event.target, active());
    else if (event.detail?.adoptedTab && workspaceOf(event.target) !== active()) {
      assign(event.target, active());
      apply();
    }
  });
  container.addEventListener("TabUnpinned", event => assign(event.target, active()));
  // A tab joining or leaving a group can show or hide that group here.
  container.addEventListener("TabGrouped", () => apply());
  container.addEventListener("TabUngrouped", () => apply());
  // Selecting a tab from another workspace (e.g. "Switch to tab" in the address bar) goes there.
  container.addEventListener("TabSelect", event => {
    const ws = workspaceOf(event.target);
    if (!event.target.pinned && ws && ws !== active() && workspaces().some(w => w.id === ws)) {
      SessionStore.setCustomWindowValue(win, KEY, ws);
      apply();
    }
  });
  // A restored tab (reopening a closed tab, or the session after a restart) takes its saved
  // workspace, unless it's being shown right now, in which case it joins the active one.
  container.addEventListener("SSTabRestoring", event => {
    if (event.target.selected && workspaceOf(event.target) !== active()) assign(event.target, active());
    apply();
  });
  win.addEventListener("SSWindowRestored", apply);

  const onListChange = () => apply();
  Services.prefs.addObserver(LIST, onListChange);
  win.addEventListener("unload", () => Services.prefs.removeObserver(LIST, onListChange), { once: true });

  win.aetherWorkspaces = { render, apply, switchTo, moveTabs, active, workspaceOf, create, rename, remove, deleteWorkspace };
  // A window made from a moved tab ("Move to New Window", or dragged out) opens on its workspace.
  if (!SessionStore.getCustomWindowValue(win, KEY)) {
    const moved = resolve(workspaceOf(gBrowser.selectedTab));
    if (moved) SessionStore.setCustomWindowValue(win, KEY, moved);
  }
  apply();
}
