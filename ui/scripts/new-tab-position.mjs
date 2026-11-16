import { tr } from "./l10n.mjs";
// With vertical tabs, where a new tab (Ctrl+T, the + button) goes: to the top of the list, just
// below pinned tabs, like Zen, or to the end. The aether.newTabsAt pref ("top" or "bottom", in
// Astrelle Settings) decides, and the "+ New Tab" button moves to the same end (styles/aether.css,
// :root[aether-newtabs-top]). With top tabs new tabs always go at the end
// (browser.tabs.insertAfterCurrent is off in aether.cfg). Tabs opened from links are left where
// Firefox puts them.

const PREF = "aether.newTabsAt";
const VERTICAL_TABS = "sidebar.verticalTabs";

export function init(win) {
  const { gBrowser, BrowserCommands } = win;
  const atTop = () => Services.prefs.getBoolPref(VERTICAL_TABS, false) && Services.prefs.getStringPref(PREF, "top") === "top";

  const update = () => win.document.documentElement.toggleAttribute("aether-newtabs-top", atTop());
  Services.prefs.addObserver(PREF, update);
  Services.prefs.addObserver(VERTICAL_TABS, update);
  win.addEventListener("unload", () => {
    Services.prefs.removeObserver(PREF, update);
    Services.prefs.removeObserver(VERTICAL_TABS, update);
  }, { once: true });
  update();

  // In the sidebar, the far end of "+ New Tab" (the right, or the left in right-to-left
  // languages) opens a private window instead (Firefox keeps private tabs in windows of their
  // own). Its icon and highlight are in styles/aether.css.
  const PRIVATE_WIDTH = 40;
  for (const id of ["tabs-newtab-button", "vertical-tabs-newtab-button"]) {
    const button = win.document.getElementById(id);
    if (!button) continue;
    const tooltip = button.getAttribute("tooltiptext");
    const onPrivate = event => {
      if (!Services.prefs.getBoolPref(VERTICAL_TABS, false)) return false;
      const { left, right } = button.getBoundingClientRect();
      return win.getComputedStyle(button).direction === "rtl" ? event.clientX < left + PRIVATE_WIDTH : event.clientX > right - PRIVATE_WIDTH;
    };
    button.addEventListener("mousemove", event => {
      const hover = onPrivate(event);
      button.toggleAttribute("aether-private-hover", hover);
      if (hover) button.setAttribute("tooltiptext", tr("astrelle-new-private-window-tooltip"));
      else if (tooltip) button.setAttribute("tooltiptext", tooltip);
      else button.removeAttribute("tooltiptext");
    });
    button.addEventListener("mouseleave", () => button.removeAttribute("aether-private-hover"));
    // Caught on the way down, at the window: with containers on, Firefox's own click listener on
    // the button (its press-and-hold menu) was added first and would open a tab as well.
    win.addEventListener("click", event => {
      if (event.button !== 0 || !button.contains(event.target) || !onPrivate(event)) return;
      event.preventDefault();
      event.stopPropagation();
      win.OpenBrowserWindow({ private: true });
    }, true);
  }

  const firefoxOpenTab = BrowserCommands.openTab;
  BrowserCommands.openTab = function (options) {
    let opened = null;
    const onOpen = event => { opened ??= event.target; };
    gBrowser.tabContainer.addEventListener("TabOpen", onOpen);
    try {
      return firefoxOpenTab.call(this, options);
    } finally {
      gBrowser.tabContainer.removeEventListener("TabOpen", onOpen);
      if (opened && !opened.pinned && atTop()) {
        gBrowser.moveTabTo(opened, { tabIndex: gBrowser.pinnedTabCount, forceUngrouped: true });
      }
    }
  };
}
