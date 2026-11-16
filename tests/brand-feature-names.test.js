// Firefox's features carry Astrelle's names, not Firefox's (Astrelle can't present them as
// Firefox): Suggestions, Tab Overview, Astrelle Home, Astrelle Labs, Translations, Screenshots;
// Mozilla's services keep their own (Firefox Relay). A new profile has none of Mozilla's default
// bookmarks ("Mozilla Firefox", "Customize Firefox"...).
const l10n = new Localization(["toolkit/branding/brandings.ftl", "browser/firefoxView.ftl", "browser/preferences/preferences.ftl"], false);
const [view, home] = await l10n.formatValues([{ id: "firefoxview-page-title" }, { id: "home-prefs-content-header2" }]);
const bookmarks = await PlacesUtils.bookmarks.search({ query: "Firefox" });
const fileText = await (await fetch("chrome://aether/content/locales/en-US/toolkit/branding/brandings.ftl")).text();
const term = name => fileText.match(new RegExp(`^${name} = (.*)$`, "m"))?.[1];
const names = ["-firefox-suggest-brand-name", "-firefox-home-brand-name", "-firefoxview-brand-name", "-firefoxlabs-brand-name",
  "-translations-brand-name", "-screenshots-brand-name"].map(term);
return {
  ok: view === "Tab Overview" && /^Astrelle Home/.test(home ?? "") && names.every(n => n && !/Firefox/.test(n))
    && term("-relay-brand-name") === "Firefox Relay" && bookmarks.length === 0,
  view, home, names, bookmarks: bookmarks.map(b => b.title),
};
