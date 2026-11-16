// timeout: 120
// With Sip switched off (the old one and the new one), the move waits, the old Sip and its data
// kept, and finishes when Sip is turned on.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const { setSip } = ChromeUtils.importESModule("chrome://aether/content/scripts/choices.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const job = await AddonManager.getInstallForFile(new FileUtils.File(PathUtils.join(PathUtils.parent(Services.env.get("ASTRELLE_UI")), "tests", "fixtures", "sip-0.1.xpi")));
const old = await new Promise(resolve => { job.addListener({ onInstallEnded: (_, a) => resolve(a) }); job.install(); });
await wait(1500);
await old.disable();
const fresh = await AddonManager.getAddonByID(sip.SIP_ID);
if (fresh.isActive) await fresh.disable();
Services.prefs.setStringPref("aether.sip.migration", "");
await sip.migrateSip();
const waiting = Services.prefs.getStringPref("aether.sip.migration") !== "done" && !!(await AddonManager.getAddonByID(sip.OLD_SIP_ID));
await setSip(true);
let done = false;
for (let i = 0; i < 60 && !done; i++) {
  await wait(500);
  done = Services.prefs.getStringPref("aether.sip.migration") === "done";
}
return { ok: waiting && done && !(await AddonManager.getAddonByID(sip.OLD_SIP_ID)), waiting, done };
