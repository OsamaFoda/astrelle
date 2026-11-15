// timeout: 45
// Past today's share of the budget, the New Tab page's data card says by how much (in the warning
// colour), rather than "Safe today: 0 B".
// A stand-in add-on with Sip's id holds the data, so the check needs no copy of Sip.
const wait = ms => new Promise(r => setTimeout(r, ms));
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { ExtensionStorageIDB } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorageIDB.sys.mjs");
const dir = PathUtils.join(PathUtils.profileDir, "sip-stand-in");
await IOUtils.writeJSON(PathUtils.join(dir, "manifest.json"), {
  manifest_version: 2, name: "Sip stand-in", version: "1.0",
  permissions: ["storage"],
  browser_specific_settings: { gecko: { id: "sip@osama.local" } },
});
await AddonManager.installTemporaryAddon(await IOUtils.getFile(dir));
await wait(1000);
const policy = WebExtensionPolicy.getByID("sip@osama.local");
const db = await ExtensionStorageIDB.open(ExtensionStorageIDB.getStoragePrincipal(policy.extension));
const now = new Date();
const pad = n => String(n).padStart(2, "0");
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// The period started today, so today's share is about a thirtieth of 10 GB, and 2 GB is well past it.
await db.set({ settings: { budgetGB: 10, resetDay: now.getDate() }, days: { [key(now)]: { total: 2 * 1024 ** 3 } } });
BrowserCommands.openTab();
await wait(1500);
const doc = gBrowser.selectedBrowser.contentWindow.document;
const safe = doc.getElementById("safe");
return { ok: /^Over today's share by \d/.test(safe.textContent) && safe.classList.contains("over"), text: safe.textContent };
