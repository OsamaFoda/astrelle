// timeout: 45
// Sip's button, with its budget badge, sits on the toolbar beside the add-ons button (not hidden in
// the add-ons menu) for a profile whose toolbar layout predates it.
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const ID = "sip_osamafoda_github_io-browser-action";
Services.prefs.setIntPref("aether.toolbarLayout", 2);
const win = OpenBrowserWindow();
await new Promise(r => win.addEventListener("load", r, { once: true }));
await wait(1500);
const xpi = PathUtils.join(Services.env.get("ASTRELLE_UI"), "extensions", "sip@osamafoda.github.io.xpi"); // the ui/ being checked
await AddonManager.installTemporaryAddon(new FileUtils.File(xpi));
await wait(2000);
const placement = CustomizableUI.getPlacementOfWidget(ID);
const inBar = Boolean(win.document.getElementById("nav-bar-customization-target").querySelector(`#${ID}`));
win.close();
return { ok: placement?.area === CustomizableUI.AREA_NAVBAR && inBar, area: placement?.area, inBar, layout: Services.prefs.getIntPref("aether.toolbarLayout") };
