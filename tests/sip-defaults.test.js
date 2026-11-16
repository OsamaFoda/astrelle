// Astrelle's copy of what Sip means by a missing setting is Sip's own (Sip's specification,
// section 2.2), and sipDb reads what Sip itself wrote through browser.storage.local.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { SIP_DEFAULTS, SIP_ID, sipGet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const same = JSON.stringify(SIP_DEFAULTS) === JSON.stringify({
  saver: true, autoplay: true, sites: {}, youtube: 480, budgetGB: 0, period: { kind: "monthly", day: 1 },
});
const addon = await AddonManager.getAddonByID(SIP_ID);
if (addon && !addon.isActive) await addon.enable();
let summary = null;
for (let i = 0; i < 40 && !summary; i++) {
  ({ summary } = await sipGet(["summary"]));
  await wait(250);
}
return { ok: same && !!addon && summary?.v === 1, same, installed: !!addon, readsSip: summary?.v === 1 };
