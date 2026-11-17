// timeout: 60
// Frosted Glass on a wallpaper: by default it's the theme's, on the window and the home page alike.
// Astrelle Settings lists it first, chosen, then Astrelle's own two (its icons as one night sky, and
// its calm sky), with their pictures; chosen, they're on the window and the home page, whose text
// turns light on their dark sky even in light mode (as here).
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.clearUserPref("aether.wallpaper");
const root = document.documentElement;
BrowserCommands.openTab(); // the home page, as a new tab opens it
await wait(2500);
const browser = gBrowser.selectedBrowser;
const page = () => browser.contentDocument.documentElement;
const picture = el => el.style.getPropertyValue("--aether-wallpaper").split("/").pop().replace('")', "");
const out = { byDefault: [root.getAttribute("aether-wallpaper"), page().getAttribute("aether-wallpaper")] };
const settings = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = settings;
await wait(2500);
const sdoc = settings.linkedBrowser.contentDocument;
const tiles = [...sdoc.querySelectorAll("#wallpapers [data-url]")];
const img = tiles[1]?.querySelector("img");
for (let i = 0; i < 40 && !(img?.complete && img.naturalWidth); i++) await wait(250);
out.tiles = tiles.slice(0, 3).map(t => `${t.dataset.url || "(default)"}:${t.querySelector("span")?.textContent}:${t.getAttribute("aria-pressed")}`);
out.thumbnailSmall = img?.naturalWidth > 0 && img.naturalWidth < 1000;
for (const i of [1, 2]) {
  tiles[i].click();
  await wait(800);
  for (let j = 0; j < 20 && !page().hasAttribute("aether-wallpaper-tone"); j++) await wait(250);
  const [r, g, b] = browser.contentWindow.getComputedStyle(browser.contentDocument.body).color.match(/\d+/g).map(Number);
  out[tiles[i].dataset.url] = [Services.prefs.getStringPref("aether.wallpaper", ""), picture(root), picture(page()),
    page().getAttribute("aether-wallpaper-tone"), r + g + b > 600 ? "light text" : `text ${r},${g},${b}`];
}
for (let i = 0; i < 40 && !root.style.getPropertyValue("--aether-wallpaper-frosted"); i++) await wait(250);
out.frosted = /^url\("file:.*\.jpg"\)$/.test(root.style.getPropertyValue("--aether-wallpaper-frosted"));
tiles[0].click();
await wait(800);
out.back = [Services.prefs.getStringPref("aether.wallpaper", "(cleared)"), root.getAttribute("aether-wallpaper"), page().getAttribute("aether-wallpaper")];
Services.prefs.clearUserPref("aether.wallpaper");
Services.prefs.clearUserPref("aether.liquidGlass");
const ok = out.byDefault.join() === "theme,theme"
  && out.tiles.join() === "(default):Your theme:true,astrelle:Astrelle:false,astrelle-calm:Calm sky:false" && out.thumbnailSmall
  && out.astrelle.join() === "astrelle,astrelle.jpg,astrelle.jpg,dark,light text"
  && out["astrelle-calm"].join() === "astrelle-calm,astrelle-calm.jpg,astrelle-calm.jpg,dark,light text"
  && out.frosted && out.back.join() === ",theme,theme";
return { ok, ...out };
