// Firefox's own sidebar button (a second "collapse sidebar" button beside Compact Mode) never
// shows, even after Firefox puts it back on the toolbar, and tabs stay down the side.
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(1000);
// What Firefox does when its sidebar setting comes back on, or a toolbar migration runs.
if (!CustomizableUI.getPlacementOfWidget("sidebar-button")) {
  CustomizableUI.addWidgetToArea("sidebar-button", CustomizableUI.AREA_NAVBAR, 0);
}
await wait(800);
const button = document.getElementById("sidebar-button");
const shown = Boolean(button && button.getBoundingClientRect().width);
const vertical = Services.prefs.getBoolPref("sidebar.verticalTabs");
return { ok: Boolean(button) && !shown && vertical, onToolbar: Boolean(button), shown, vertical };
