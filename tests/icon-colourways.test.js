// The app icon picker: each icon's colours (Original, Nightfall, Sunrise) in a dropdown on its
// card. Choosing colours chooses that icon in them (the pref, the card's picture, pressed); the
// other cards stay as they were; and the choice shows when the page opens again.
const wait = ms => new Promise(r => setTimeout(r, ms));
const { ICONS, iconURL } = ChromeUtils.importESModule("chrome://aether/content/scripts/app-icon.mjs");
const files = await Promise.all(ICONS.map(async name => (await fetch(iconURL(name))).ok));
const open = async () => {
  const tab = gBrowser.selectedTab = gBrowser.addTrustedTab("about:astrelle");
  await wait(2000);
  return [tab, tab.linkedBrowser.contentDocument];
};
let [tab, doc] = await open();
const card = shape => doc.querySelector(`.app-icon-card[data-shape="${shape}"]`);
const select = card("aurora").querySelector("select");
select.value = "sunrise";
select.dispatchEvent(new doc.defaultView.Event("change"));
await wait(300);
const pref = Services.prefs.getStringPref("aether.appIcon");
const picture = card("aurora").querySelector("img").getAttribute("src").endsWith("aurora-sunrise.svg");
const pressed = card("aurora").querySelector(".app-icon").getAttribute("aria-pressed") === "true"
  && card("eclipse").querySelector(".app-icon").getAttribute("aria-pressed") === "false";
const othersOriginal = card("comet").querySelector("select").value === "original";
gBrowser.removeTab(tab);
[tab, doc] = await open();
const kept = card("aurora").querySelector("select").value === "sunrise" && card("aurora").querySelector(".app-icon").getAttribute("aria-pressed") === "true";
Services.prefs.clearUserPref("aether.appIcon");
return { ok: files.every(Boolean) && ICONS.length === 12 && pref === "aurora-sunrise" && picture && pressed && othersOriginal && kept,
  icons: ICONS.length, files: files.every(Boolean), pref, picture, pressed, othersOriginal, kept };
