// The welcome's Sip step offers the same disk cache choice as Settings.
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2000);
const select = tab.linkedBrowser.contentDocument.getElementById("cache-size");
const shownAtFirst = select?.value;
select.value = "524288";
select.dispatchEvent(new Event("change"));
const chosen = Services.prefs.getIntPref("browser.cache.disk.capacity");
return { ok: shownAtFirst === "1048576" && chosen === 524288, shownAtFirst, chosen };
