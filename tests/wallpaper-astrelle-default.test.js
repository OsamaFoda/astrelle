// timeout: 60
// Frosted Glass on a wallpaper: by default it's Astrelle's own (its icons as one night sky), on the
// window and on the home page alike; Astrelle Settings lists it first, chosen, with its picture,
// then the theme's, which still works when chosen. The home page's text is light on its dark sky.
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.clearUserPref("aether.wallpaper");
const root = document.documentElement;
BrowserCommands.openTab(); // the home page, as a new tab opens it
await wait(2500);
const browser = gBrowser.selectedBrowser;
const page = () => browser.contentDocument.documentElement;
const out = {
  window: [root.getAttribute("aether-wallpaper"), root.style.getPropertyValue("--aether-wallpaper").split("/").pop()],
  home: [page().getAttribute("aether-wallpaper"), page().style.getPropertyValue("--aether-wallpaper").split("/").pop()],
};
for (let i = 0; i < 40 && !root.style.getPropertyValue("--aether-wallpaper-frosted"); i++) await wait(250);
// A dark picture: the page's text turns light to stay readable on it, even in light mode (as here).
for (let i = 0; i < 20 && !page().hasAttribute("aether-wallpaper-tone"); i++) await wait(250);
const [r, g, b] = browser.contentWindow.getComputedStyle(browser.contentDocument.body).color.match(/\d+/g).map(Number);
out.tone = [page().getAttribute("aether-wallpaper-tone"), r + g + b > 600 ? "light text" : `text ${r},${g},${b}`];
out.frosted = /^url\("file:.*\.jpg"\)$/.test(root.style.getPropertyValue("--aether-wallpaper-frosted"));
const settings = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = settings;
await wait(2500);
const sdoc = settings.linkedBrowser.contentDocument;
const tiles = [...sdoc.querySelectorAll("#wallpapers [data-url]")];
const img = tiles[0]?.querySelector("img");
for (let i = 0; i < 40 && !(img?.complete && img.naturalWidth); i++) await wait(250);
out.tiles = tiles.slice(0, 2).map(t => `${t.dataset.url || "(default)"}:${t.querySelector("span")?.textContent}:${t.getAttribute("aria-pressed")}`);
out.thumbnailSmall = img?.naturalWidth > 0 && img.naturalWidth < 1000;
tiles[1].click();
await wait(800);
out.themeChosen = [Services.prefs.getStringPref("aether.wallpaper", ""), root.getAttribute("aether-wallpaper"), page().getAttribute("aether-wallpaper")];
Services.prefs.clearUserPref("aether.wallpaper");
Services.prefs.clearUserPref("aether.liquidGlass");
const ok = out.window.join() === "picture,astrelle.jpg\")" && out.home.join() === "picture,astrelle.jpg\")" && out.frosted && out.tone.join() === "dark,light text"
  && out.tiles.join() === "(default):Astrelle:true,theme:Your theme:false" && out.thumbnailSmall
  && out.themeChosen.join() === "theme,theme,theme";
return { ok, ...out };
