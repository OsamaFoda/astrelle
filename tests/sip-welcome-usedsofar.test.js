// timeout: 60
// The welcome turns Sip on with a budget and what the carrier says was used so far: Sip counts
// on from there, and is marked set up (no first-run page of its own).
const { sipGet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
doc.getElementById("budget-gb").value = "50";
doc.getElementById("used-so-far").value = "12";
doc.getElementById("sip-on").click();
await wait(6000);
const stored = await sipGet(null);
const checks = {
  budget: stored["opt.budgetGB"] === 50,
  used: (stored.summary?.used ?? 0) >= 12e9,
  setUp: stored["opt.firstRunDone"] === true,
};
return { ok: Object.values(checks).every(Boolean), checks, used: stored.summary?.used };
