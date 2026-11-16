// A peek sits centred over the page (not over the sidebar), takes the keyboard when it opens, and
// closes when you switch tabs: it belongs to the page it was opened from.
const wait = ms => new Promise(r => setTimeout(r, ms));
gBrowser.selectedTab = gBrowser.addTrustedTab("about:mozilla");
await wait(800);
window.aetherPeek.open("about:robots");
await wait(1500);
const peekBrowser = document.querySelector("#aether-peek browser");
const focused = document.activeElement === peekBrowser;
const card = document.querySelector(".aether-peek-card").getBoundingClientRect();
const page = document.getElementById("tabbrowser-tabbox").getBoundingClientRect();
const centred = Math.abs((card.left + card.right) / 2 - (page.left + page.right) / 2) < 2 && card.left >= page.left;
gBrowser.selectedTab = gBrowser.tabs[0];
await wait(500);
const closedOnSwitch = !window.aetherPeek.isOpen;
return { ok: focused && centred && closedOnSwitch, focused, centred, closedOnSwitch };
