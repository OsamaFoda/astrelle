// timeout: 120
// A move stopped partway (as a crash would) leaves the old Sip installed with its data, and the
// next run finishes with the same id, without counting anything twice.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const job = await AddonManager.getInstallForFile(new FileUtils.File(PathUtils.join(PathUtils.parent(Services.env.get("ASTRELLE_UI")), "tests", "fixtures", "sip-0.1.xpi")));
const old = await new Promise(resolve => { job.addListener({ onInstallEnded: (_, a) => resolve(a) }); job.install(); });
await wait(1500);
const today = new Date();
const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
await sip.sipSet({ days: { [k]: { total: 7_000_000, sites: { "b.com": 7_000_000 } } }, settings: { budgetGB: 20 } }, [], sip.OLD_SIP_ID);
await old.reload();
await wait(1500);
const fresh = await AddonManager.getAddonByID(sip.SIP_ID);
if (!fresh.isActive) await fresh.enable();
Services.prefs.setStringPref("aether.sip.migration", "");
Services.prefs.setStringPref("aether.sip.migration.failAfter", "import");
await sip.migrateSip();
const pending = Services.prefs.getStringPref("aether.sip.migration");
const oldStill = await AddonManager.getAddonByID(sip.OLD_SIP_ID);
const oldOff = !!oldStill && !oldStill.isActive;
await oldStill.enable();   // its storage can only be read while it's on
await wait(1500);
const oldData = await sip.sipGet(null, sip.OLD_SIP_ID);
Services.prefs.clearUserPref("aether.sip.migration.failAfter");
await wait(1500);
await sip.migrateSip();
const after = await sip.sipGet(null);
const checks = {
  pending: pending.startsWith("pending:"),
  oldKeptWithData: oldOff && oldData.days?.[k]?.total === 7_000_000,
  done: Services.prefs.getStringPref("aether.sip.migration") === "done",
  sameId: after.ack?.import === pending.slice(8),
  once: after[`day.${k}`]?.sites?.["b.com"] === 7_000_000,
};
return { ok: Object.values(checks).every(Boolean), error: Services.prefs.getStringPref("aether.sip.migration.lastError", ""), checks };
