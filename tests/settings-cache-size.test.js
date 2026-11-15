// Astrelle Settings lets you choose the disk cache's size, and shows the size in use.
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const select = doc.getElementById("cache-size");
const shownAtFirst = select.value;
select.value = "2097152";
select.dispatchEvent(new Event("change"));
const chosen = Services.prefs.getIntPref("browser.cache.disk.capacity");
return { ok: shownAtFirst === "1048576" && chosen === 2097152, shownAtFirst, chosen };
