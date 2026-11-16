// timeout: 60
// New Tab's data card shows only what Sip's summary says: its texts, its bar (used, the hatched
// projection, the pace label, the level's colour), today's lines only on the summary's own day,
// and Sip's language and direction.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { SIP_ID, sipSet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const addon = await AddonManager.getAddonByID(SIP_ID);
if (!addon.isActive) await addon.enable();
await wait(1500);
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const base = {
  v: 1, day: today, lang: "en", dir: "ltr", hasBudget: true, ratio: 0.62, projRatio: 0.97, pace: "ok", level: "ok",
  text: { hero: "18.8 GB left · 18 days", left: "18.8 GB left of 50 GB", days: "18 days left", today: "Today 620 MB of 1.08 GB share",
    over: "", renews: "Renews 1 Dec", paceShort: "On track" },
};
const cases = {
  ok: base,
  overToday: { ...base, text: { ...base.text, over: "410 MB over · tomorrow ≈ 980 MB" } },
  overBudget: { ...base, ratio: 1.03, projRatio: 1.2, pace: "over", level: "over", text: { ...base.text, hero: "Over by 1.20 GB · 18 days", paceShort: "Over budget" } },
  noBudget: { ...base, hasBudget: false, text: { ...base.text, hero: "Used this period: 3.2 GB", today: "Today 620 MB", paceShort: "" } },
  stale: { ...base, day: "2020-01-01" },
  arabic: { ...base, lang: "ar", dir: "rtl", text: { ...base.text, hero: "متبقٍ 18.8 جيجا · 18 يومًا" } },
};
const tab = gBrowser.addTrustedTab("chrome://aether/content/newtab/newtab.html");
gBrowser.selectedTab = tab;
await wait(2500);
const results = {};
for (const [name, summary] of Object.entries(cases)) {
  await sipSet({ summary });
  await wait(700);
  const doc = tab.linkedBrowser.contentDocument;
  const $ = id => doc.getElementById(id);
  results[name] = {
    shown: !$("data").hidden, hero: $("data-hero").textContent, budget: !$("budget").hidden, bar: $("bar").className.trim(),
    proj: $("bar-proj").style.width, pill: $("pace-pill").hidden ? "" : $("pace-pill").textContent,
    todayShown: !$("today-lines").hidden, today: $("data-today").textContent, over: $("data-over").textContent, dir: $("data").dir,
  };
}
const r = results;
const checks = {
  ok: r.ok.shown && r.ok.hero === base.text.hero && r.ok.pill === "On track" && r.ok.proj === "35%" && r.ok.today === base.text.today && r.ok.bar === "bar",
  overToday: r.overToday.over === cases.overToday.text.over,
  overBudget: r.overBudget.bar === "bar danger" && r.overBudget.pill === "Over budget",
  noBudget: !r.noBudget.budget && r.noBudget.hero === cases.noBudget.text.hero,
  stale: !r.stale.todayShown,
  arabic: r.arabic.dir === "rtl" && r.arabic.hero === cases.arabic.text.hero,
};
return { ok: Object.values(checks).every(Boolean), checks, results };
