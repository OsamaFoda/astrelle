// The welcome's colour swatches: one circle each with its name under it (the name is its own
// span for translation, and mustn't be drawn as a second circle); Sip's YouTube and disk choices
// each have the menu under the explanation, not inside the sentence. Settings' shortcut list
// keeps only the keys muted.
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const swatch = doc.querySelector(".swatch");
const [dot, label] = swatch.querySelectorAll("span");
const style = doc.defaultView.getComputedStyle(label);
const labelPlain = style.borderRadius === "0px" && style.backgroundImage === "none" && style.width !== "52px";
const dotRound = doc.defaultView.getComputedStyle(dot).borderRadius === "50%";
const select = doc.getElementById("youtube-quality");
const explanation = select.closest("label").querySelector("span");
const sipStep = select.closest(".step");
sipStep.hidden = false; // laid out, to measure
const menuUnderWords = select.getBoundingClientRect().top >= explanation.getBoundingClientRect().bottom - 1;
sipStep.hidden = true;

const settings = gBrowser.addTrustedTab("about:astrelle");
gBrowser.selectedTab = settings;
await wait(2000);
const sdoc = settings.linkedBrowser.contentDocument;
const row = sdoc.querySelector(".keys li");
const [keys, words] = row.querySelectorAll(":scope > span");
const colour = el => sdoc.defaultView.getComputedStyle(el).color;
const wordsNotMuted = colour(keys) !== colour(words);
return { ok: labelPlain && dotRound && menuUnderWords && wordsNotMuted, labelPlain, dotRound, menuUnderWords, wordsNotMuted, label: style.width };
