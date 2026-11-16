// Astrelle continues where you left off by default (browser.startup.page 3), and Settings'
// "When Astrelle starts" switches between that and starting fresh.
const wait = ms => new Promise(r => setTimeout(r, ms));
const byDefault = Services.prefs.getDefaultBranch("").getIntPref("browser.startup.page");
const tab = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const pressed = () => doc.querySelector('[data-pref="startup"] [aria-pressed="true"]')?.dataset.value;
const shownAtFirst = pressed();
doc.querySelector('[data-pref="startup"] [data-value="fresh"]').click();
await wait(300);
const fresh = Services.prefs.getIntPref("browser.startup.page");
Services.prefs.setIntPref("browser.startup.page", 3);
await wait(300);
const follows = pressed();
Services.prefs.clearUserPref("browser.startup.page");
return { ok: byDefault === 3 && shownAtFirst === "continue" && fresh === 1 && follows === "continue", byDefault, shownAtFirst, fresh, follows };
