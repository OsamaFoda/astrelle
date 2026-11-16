// timeout: 90
// Settings' Sip card: each control writes its key or command, the status line follows Sip's
// summary within a second, and a period of every N days is left to Sip's own settings.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { SIP_ID, sipGet, sipSet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = tab;
await wait(3000);
const doc = tab.linkedBrowser.contentDocument;
const $ = id => doc.getElementById(id);
if (!$("sip-on").checked) {
  $("sip-on").click();
  await wait(4000);
}
const change = async (id, value) => {
  $(id).value = value;
  $(id).dispatchEvent(new doc.defaultView.Event("change", { bubbles: true }));
  await wait(1000);
};
await change("budget-gb", "42");
await change("youtube-quality", "720");
$("used-so-far").value = "12";
$("used-set").click();
await wait(2500);
const stored = await sipGet(null);
const summary = stored.summary;
await sipSet({ summary: { ...summary, text: { ...summary.text, hero: "Status from Sip" } } });
await wait(1000);
const status = $("sip-status").textContent;
await sipSet({ "opt.period": { kind: "days", every: 30, from: "2026-11-01" } });
await wait(1000);
const checks = {
  budget: stored["opt.budgetGB"] === 42,
  youtube: stored["opt.youtube"] === 720,
  usedSoFar: summary.used >= 12e9 && typeof stored.ack?.carrier === "string",
  status: status.startsWith("Status from Sip"),
  daysPeriod: $("reset-day").disabled && !$("day-note").hidden,
};
return { ok: Object.values(checks).every(Boolean), checks, status };
