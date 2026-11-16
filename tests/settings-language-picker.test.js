// Settings' Language card: a button with the language in use that folds open into a search box
// and the list; searching works by a language's own name or its name in English, and choosing one
// (by click or by keyboard) sets it and asks for a restart.
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const win = doc.defaultView;
const $ = id => doc.getElementById(id);
const shown = item => item.checkVisibility();
const visible = () => [...$("language-list").children].filter(shown).map(item => item.dataset.value);

const heading = !!doc.querySelector("#language h2");
const foldedAtFirst = !$("language-panel").checkVisibility() && !$("language-restart").checkVisibility();
$("language-current").click();
await wait(300);
const opened = $("language-panel").checkVisibility() && doc.activeElement === $("language-search");
const all = visible().length;

const type = text => { $("language-search").value = text; $("language-search").dispatchEvent(new win.Event("input")); };
type("german");
const byEnglish = visible();
type("deutsch");
const byOwn = visible();
type("francais");
const noAccents = visible();
type("en");
const startsOfWords = visible().every(value => value === "" || value.startsWith("en"));
type("zzzz");
const none = visible().length === 0 && $("language-none").checkVisibility();

type("british");
$("language-search").dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await wait(500);
const byKeyboard = Services.prefs.getStringPref("intl.locale.requested", "");
const folded = !$("language-panel").checkVisibility();
const restart = $("language-restart").checkVisibility();
const name = $("language-name").textContent;

$("language-current").click();
await wait(300);
[...$("language-list").children].find(item => item.dataset.value === "")?.click();
await wait(500);
const byClick = Services.prefs.getStringPref("intl.locale.requested", "");
Services.prefs.clearUserPref("intl.locale.requested");
return {
  ok: heading && foldedAtFirst && opened && all > 50 && byEnglish.includes("de") && byOwn.includes("de")
    && noAccents.includes("fr") && startsOfWords && none && byKeyboard === "en-GB" && folded && restart && name === "British English" && byClick === "",
  heading, foldedAtFirst, opened, all, byEnglish, byOwn, noAccents, startsOfWords, none, byKeyboard, folded, restart, name, byClick,
};
