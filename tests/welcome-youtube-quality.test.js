// timeout: 45
// The welcome's Sip step asks for the highest YouTube quality, and turning Sip on saves it to Sip.
const { ExtensionStorageIDB } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorageIDB.sys.mjs");
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const dir = PathUtils.join(PathUtils.profileDir, "sip-stand-in");
await IOUtils.writeJSON(PathUtils.join(dir, "manifest.json"), {
  manifest_version: 2, name: "Sip stand-in", version: "1.0", permissions: ["storage"],
  browser_specific_settings: { gecko: { id: "sip@osama.local" } },
});
await AddonManager.installTemporaryAddon(await IOUtils.getFile(dir));
await wait(1000);
const policy = WebExtensionPolicy.getByID("sip@osama.local");
const db = await ExtensionStorageIDB.open(ExtensionStorageIDB.getStoragePrincipal(policy.extension));
await db.set({ settings: { budgetGB: 0, resetDay: 1 } });
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const offered = doc.getElementById("youtube-quality")?.value;
doc.getElementById("youtube-quality").value = "360";
doc.getElementById("sip-on").click();
await wait(2500);
const { settings } = await db.get(["settings"]);
return { ok: offered === "480" && settings.youtube === 360, offered, saved: settings.youtube };
