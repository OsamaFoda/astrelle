// timeout: 120
// If the new Sip acknowledges the history without having merged it, Astrelle notices before
// deleting anything: the old Sip stays installed with its data, and the move stays pending.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const real = await AddonManager.getAddonByID(sip.SIP_ID);
if (real) await real.uninstall();
const dir = PathUtils.join(PathUtils.profileDir, "sip-fake");
await IOUtils.writeJSON(PathUtils.join(dir, "manifest.json"), {
  manifest_version: 3, name: "Sip fake", version: "9.0.0", permissions: ["storage"],
  background: { scripts: ["background.js"] },
  browser_specific_settings: { gecko: { id: sip.SIP_ID } },
});
await IOUtils.writeUTF8(PathUtils.join(dir, "background.js"), `
  browser.storage.onChanged.addListener(async changes => {
    const cmd = changes["cmd.import"]?.newValue;
    if (!cmd) return;
    const { ack = {} } = await browser.storage.local.get("ack");
    await browser.storage.local.set({ ack: { ...ack, import: cmd.id } });   // acknowledged, never merged
    await browser.storage.local.remove("cmd.import");
  });`);
await AddonManager.installTemporaryAddon(await IOUtils.getFile(dir));
const job = await AddonManager.getInstallForFile(new FileUtils.File(PathUtils.join(PathUtils.parent(Services.env.get("ASTRELLE_UI")), "tests", "fixtures", "sip-0.1.xpi")));
const old = await new Promise(resolve => { job.addListener({ onInstallEnded: (_, a) => resolve(a) }); job.install(); });
await wait(1500);
const today = new Date();
const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
await sip.sipSet({ days: { [k]: { total: 5_000_000, sites: { "c.com": 5_000_000 } } } }, [], sip.OLD_SIP_ID);
await old.reload();
await wait(1500);
Services.prefs.setStringPref("aether.sip.migration", "");
await sip.migrateSip();
const kept = await AddonManager.getAddonByID(sip.OLD_SIP_ID);
await kept?.enable();   // its storage can only be read while it's on
await wait(1500);
const data = await sip.sipGet(null, sip.OLD_SIP_ID);
const checks = {
  oldKept: !!kept,
  dataKept: data.days?.[k]?.total === 5_000_000,
  pending: Services.prefs.getStringPref("aether.sip.migration").startsWith("pending:"),
};
return { ok: Object.values(checks).every(Boolean), error: Services.prefs.getStringPref("aether.sip.migration.lastError", ""), checks };
