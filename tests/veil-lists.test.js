// timeout: 90
// Veil: turning protection on installs uBlock Origin (here a local stand-in with its ID, which on
// its first start saves a first choice of lists as uBlock does) and adds Veil's stronger lists
// to that choice, keeping what was chosen, plus the regional lists for the languages in use;
// then uBlock is restarted to load them. It happens once: lists turned off afterwards stay off.
// The regional lists follow the languages: Arabic gets uBlock's Arabic lists.
const { VEIL_LISTS, regionalLists, addVeilLists, UBLOCK } = ChromeUtils.importESModule("chrome://aether/content/scripts/veil.mjs");
const { setProtection } = ChromeUtils.importESModule("chrome://aether/content/scripts/choices.mjs");
const { ExtensionStorageIDB } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorageIDB.sys.mjs");
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));

// The stand-in: uBlock's ID, and uBlock's first-start choice of lists.
const dir = PathUtils.join(PathUtils.profileDir, "standin");
await IOUtils.writeJSON(PathUtils.join(dir, "manifest.json"), {
  manifest_version: 2, name: "uBlock Origin (stand-in)", version: "1.0", permissions: ["storage"],
  background: { scripts: ["bg.js"] }, browser_specific_settings: { gecko: { id: UBLOCK } },
});
await IOUtils.writeUTF8(PathUtils.join(dir, "bg.js"),
  `browser.storage.local.get("selectedFilterLists").then(b => b.selectedFilterLists ||
     browser.storage.local.set({ selectedFilterLists: ["user-filters", "ublock-filters", "easylist", "easyprivacy"] }));`);
const xpi = PathUtils.join(PathUtils.profileDir, "standin.xpi");
const zip = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
zip.open(await IOUtils.getFile(xpi), 0x04 | 0x08 | 0x20);
for (const f of ["manifest.json", "bg.js"]) zip.addEntryFile(f, Ci.nsIZipWriter.COMPRESSION_DEFAULT, await IOUtils.getFile(PathUtils.join(dir, f)), false);
zip.close();
Services.prefs.setBoolPref("xpinstall.signatures.required", false);
Services.prefs.setStringPref("aether.welcome.protectionURL", Services.io.newFileURI(await IOUtils.getFile(xpi)).spec);
Services.prefs.clearUserPref("aether.veil.lists");

// (null while it restarts, when its storage can't be opened)
const lists = async () => {
  const extension = WebExtensionPolicy.getByID(UBLOCK)?.extension;
  if (!extension) return null;
  try {
    const db = await ExtensionStorageIDB.open(ExtensionStorageIDB.getStoragePrincipal(extension));
    return (await db.get(["selectedFilterLists"])).selectedFilterLists ?? null;
  } catch {
    return null;
  }
};
await setProtection(true);
let selected = null;
for (let i = 0; i < 80; i++) {
  await wait(250);
  selected = await lists();
  if (selected?.includes(VEIL_LISTS[0]) && Services.prefs.getIntPref("aether.veil.lists", 0)) break;
}
const out = {};
out.keptFirstChoice = ["user-filters", "ublock-filters", "easylist", "easyprivacy"].every(k => selected?.includes(k));
out.veilAdded = VEIL_LISTS.every(k => selected?.includes(k));
out.regionalAdded = regionalLists().every(k => selected?.includes(k));
for (let i = 0; i < 40 && !(await AddonManager.getAddonByID(UBLOCK))?.isActive; i++) await wait(250);
out.running = (await AddonManager.getAddonByID(UBLOCK))?.isActive;
out.standIn = (await AddonManager.getAddonByID(UBLOCK))?.name === "uBlock Origin (stand-in)";
out.noDuplicates = new Set(selected).size === selected?.length;
out.buttonOnToolbar = CustomizableUI.getPlacementOfWidget("ublock0_raymondhill_net-browser-action")?.area === "nav-bar";
// Once: a list turned off afterwards isn't added back.
const extension = WebExtensionPolicy.getByID(UBLOCK).extension;
const db = await ExtensionStorageIDB.open(ExtensionStorageIDB.getStoragePrincipal(extension));
await db.set({ selectedFilterLists: selected.filter(k => k !== "adguard-generic") });
const { init } = ChromeUtils.importESModule("chrome://aether/content/scripts/veil.mjs");
init(); // already done: nothing to do
await wait(500);
out.respectsChanges = !(await lists()).includes("adguard-generic");
out.arabic = ["ara-0"].every(k => regionalLists(["ar"]).includes(k)) && regionalLists(["fr"]).includes("FRA-0") && regionalLists(["xx"]).length === 0;
await (await AddonManager.getAddonByID(UBLOCK)).uninstall();
for (const p of ["xpinstall.signatures.required", "aether.welcome.protectionURL", "aether.veil.lists"]) Services.prefs.clearUserPref(p);
return { ok: Object.values(out).every(Boolean), ...out, selected };
