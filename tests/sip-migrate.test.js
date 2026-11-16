// timeout: 120
// Moving Sip 0.1's history to the new add-on: the old one installed for real with 30 days, a
// budget, a renewal day, a site it allowed, a YouTube choice and its button in a place of its own.
// After migrateSip(): the history and settings are in the new Sip, a backup holds the 30 days,
// the old one is gone, and the new button is where the old one was.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const install = async path => {
  const job = await AddonManager.getInstallForFile(new FileUtils.File(path));
  return new Promise((resolve, reject) => {
    job.addListener({ onInstallEnded: (_, a) => resolve(a), onInstallFailed: () => reject(new Error("install failed")) });
    job.install();
  });
};

const old = await install(PathUtils.join(PathUtils.parent(Services.env.get("ASTRELLE_UI")), "tests", "fixtures", "sip-0.1.xpi"));
await wait(1500);
const days = {};
for (let i = 0; i < 30; i++) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  days[key(d)] = { total: 1_000_000 * (i + 1), sites: { "a.com": 1_000_000 * (i + 1) } };
}
await sip.sipSet({ days, notified: {}, settings: { saver: true, autoplay: true, trackers: true, images: false, fonts: false,
  youtube: 360, allow: ["shop.com"], budgetGB: 50, resetDay: 7, notify: true } }, [], sip.OLD_SIP_ID);
await old.reload();
await wait(2000);
CustomizableUI.addWidgetToArea(sip.OLD_SIP_WIDGET, CustomizableUI.AREA_NAVBAR, 1);
const where = CustomizableUI.getPlacementOfWidget(sip.OLD_SIP_WIDGET);

const fresh = await AddonManager.getAddonByID(sip.SIP_ID);
if (fresh && !fresh.isActive) await fresh.enable();
Services.prefs.setStringPref("aether.sip.migration", "");
await sip.migrateSip();

const after = await sip.sipGet(null);
const backups = await IOUtils.getChildren(PathUtils.join(PathUtils.profileDir, "sip-migration"));
const backup = backups.length ? await IOUtils.readJSON(backups.find(p => p.endsWith(".json"))) : null;
const placed = CustomizableUI.getPlacementOfWidget(sip.SIP_WIDGET);
const checks = {
  done: Services.prefs.getStringPref("aether.sip.migration") === "done",
  oldGone: !(await AddonManager.getAddonByID(sip.OLD_SIP_ID)),
  days: Object.entries(days).every(([k, d]) => after[`day.${k}`]?.total === d.total),
  acked: typeof after.ack?.import === "string" && !("cmd.import" in after),
  settings: after["opt.youtube"] === 360 && after["opt.budgetGB"] === 50 && after["opt.period"]?.day === 7
    && JSON.stringify(after["opt.sites"]) === JSON.stringify({ "shop.com": { autoplay: false, trackers: false, images: false, fonts: false } }),
  setUp: after["opt.firstRunDone"] === true,
  backup: !!backup && Object.keys(backup.data.days).length === 30,
  button: placed?.area === where?.area && placed?.position === where?.position,
};
return { ok: Object.values(checks).every(Boolean), error: Services.prefs.getStringPref("aether.sip.migration.lastError", ""), checks, where, placed };
