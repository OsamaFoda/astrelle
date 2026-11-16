// In a right-to-left language the welcome's arrows turn round: Continue points left, Back right.
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.locale.availableLocales = ["en-US", "ar"];
Services.locale.requestedLocales = ["ar"];
await wait(500);
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2500);
const doc = tab.linkedBrowser.contentDocument;
const win = doc.defaultView;
const flipped = transform => /^matrix\(-1,/.test(transform);
const go = win.getComputedStyle(doc.querySelector(".go"), "::after").transform;
const back = win.getComputedStyle(doc.querySelector(".back svg")).transform;
const dir = doc.documentElement.dir;
Services.locale.requestedLocales = ["en-US"];
return { ok: dir === "rtl" && flipped(go) && flipped(back), dir, go, back };
