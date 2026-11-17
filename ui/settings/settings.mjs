// Astrelle Settings (about:astrelle): every Astrelle setting on one page. Each applies the moment it's
// changed, and the page follows changes made elsewhere (the right-click menus, shortcuts, the
// Add-ons page) by reading the preferences and add-ons again whenever they change.

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
import { follow } from "../scripts/palette.mjs";
import { setUpIconPicker } from "../scripts/icon-picker.mjs";
import { iconURL } from "../scripts/app-icon.mjs";
import { desktopWallpaper } from "../scripts/wallpaper.mjs";
import { thumbnail, wallpaperFiles, wallpaperFolder } from "../scripts/thumbnails.mjs";
import { CHOICES, protectionState, setProtection, sipState, setSip, readSipBudget, saveSipBudget, followSipSettings, readSipSummary, readSipYoutube, saveSipYoutube, saveSipUsedSoFar, openSip, showSipButton } from "../scripts/choices.mjs";
import { tr } from "../scripts/l10n.mjs";
import { firefoxLocaleFor, hasFirefoxStrings, installLanguage, LOCALES, nameOf, restart, setLanguage } from "../scripts/languages.mjs";

const $ = id => document.getElementById(id);
const BOOKMARKS_BAR = "browser.toolbars.bookmarks.visibility"; // "always", "never", or "newtab" (on new tabs only)
follow(document, window);

// A quick spring on whatever was just picked.
function pop(element) {
  element.classList.remove("pop");
  void element.offsetWidth;
  element.classList.add("pop");
}

// ---- Preferences ----

function refresh() {
  for (const group of document.querySelectorAll("[data-pref]")) {
    const value = CHOICES[group.dataset.pref].get();
    for (const button of group.querySelectorAll("[data-value]")) {
      button.setAttribute("aria-pressed", button.dataset.value === value);
    }
  }
  for (const box of document.querySelectorAll("[data-bool-pref]")) {
    box.checked = Services.prefs.getBoolPref(box.dataset.boolPref, box.dataset.default === "true");
  }
  $("bookmarks-bar").checked = Services.prefs.getStringPref(BOOKMARKS_BAR, "never") !== "never";
  $("liquid-background").hidden = CHOICES.glass.get() !== "liquid";
  $("wallpapers").hidden = CHOICES.background.get() !== "wallpaper";
  let wallpaper = Services.prefs.getStringPref(WALLPAPER, "");
  // With no desktop picture to show (no tile for it), "desktop" shows the theme's.
  if (wallpaper === "desktop" && !$("wallpapers").querySelector('[data-url="desktop"]')) wallpaper = "";
  for (const tile of $("wallpapers").querySelectorAll("[data-url]")) {
    tile.setAttribute("aria-pressed", tile.dataset.url === wallpaper);
  }
  const icon = iconURL();
  $("logo").src = icon;
  document.querySelector('link[rel="icon"]').href = icon;
}

for (const group of document.querySelectorAll("[data-pref]")) {
  for (const button of group.querySelectorAll("[data-value]")) {
    button.addEventListener("click", () => {
      CHOICES[group.dataset.pref].set(button.dataset.value);
      pop(button); // the page shows the choice through the preference it watches
    });
  }
}

for (const box of document.querySelectorAll("[data-bool-pref]")) {
  box.addEventListener("change", () => Services.prefs.setBoolPref(box.dataset.boolPref, box.checked));
}

// Through Firefox's own switch (what Ctrl+Shift+B uses), which also shows or hides the bar in
// each window; the preference alone only takes effect on restart.
$("bookmarks-bar").addEventListener("change", event => {
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    win.setToolbarVisibility(win.BookmarkingUI.toolbar, event.target.checked ? "always" : "never");
  }
});

const WATCHED = ["aether.", "sidebar.verticalTabs", "ui.systemUsesDarkTheme", "browser.tabs.closeWindowWithLastTab", "browser.startup.page", BOOKMARKS_BAR];
for (const pref of WATCHED) Services.prefs.addObserver(pref, refresh);

// ---- Wallpapers ----

const WALLPAPER = "aether.wallpaper"; // "" for the theme's, "desktop", or a file: URL

function wallpaperTile(url, image, label) {
  const tile = document.createElement("button");
  tile.className = url ? "wallpaper" : "wallpaper theme";
  tile.dataset.url = url;
  tile.title = label || decodeURIComponent(url.split("/").pop());
  if (image) {
    const img = document.createElement("img");
    img.decoding = "async";
    img.alt = "";
    tile.append(img);
    thumbnail(image, window).then(src => src && (img.src = src));
  }
  if (label) tile.append(Object.assign(document.createElement("span"), { textContent: label }));
  tile.addEventListener("click", () => {
    Services.prefs.setStringPref(WALLPAPER, url);
    pop(tile);
  });
  return tile;
}

async function choosePicture() {
  const picker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
  picker.init(window.browsingContext, tr("astrelle-choose-wallpaper"), Ci.nsIFilePicker.modeOpen);
  picker.appendFilters(Ci.nsIFilePicker.filterImages);
  if (await IOUtils.exists(wallpaperFolder)) picker.displayDirectory = new FileUtils.File(wallpaperFolder);
  const result = await new Promise(resolve => picker.open(resolve));
  if (result === Ci.nsIFilePicker.returnOK) {
    Services.prefs.setStringPref(WALLPAPER, PathUtils.toFileURI(picker.file.path));
  }
}

// A picture outside the folder, chosen here or in another Settings tab, gets a tile.
function wallpaperChanged() {
  const url = Services.prefs.getStringPref(WALLPAPER, "");
  if (![...$("wallpapers").querySelectorAll("[data-url]")].some(tile => tile.dataset.url === url)) buildWallpapers();
}
Services.prefs.addObserver(WALLPAPER, wallpaperChanged);

// The theme's own wallpaper, the desktop's (if it's a picture a page can show: not GNOME's .jxl
// ones or a slideshow), the pictures in ~/Pictures/Wallpapers, one chosen from elsewhere, then
// "Choose a picture…".
async function buildWallpapers() {
  const tiles = [wallpaperTile("", null, tr("astrelle-wallpaper-theme"))];
  const desktop = await desktopWallpaper(matchMedia("(prefers-color-scheme: dark)").matches);
  if (desktop) tiles.push(wallpaperTile("desktop", desktop, tr("astrelle-wallpaper-desktop")));
  const urls = await wallpaperFiles();
  const chosen = Services.prefs.getStringPref(WALLPAPER, "");
  if (chosen && chosen !== "desktop" && !urls.includes(chosen)) urls.unshift(chosen);
  tiles.push(...urls.map(url => wallpaperTile(url, url)));
  const choose = Object.assign(document.createElement("button"), { className: "wallpaper choose", textContent: tr("astrelle-choose-picture") });
  choose.addEventListener("click", choosePicture);
  $("wallpapers").replaceChildren(...tiles, choose);
  refresh();
}

// ---- Add-ons: protection and Sip ----

async function refreshAddons() {
  const protection = (await protectionState()) === "on";
  $("protection-on").checked = protection;
  // The line under the switch tells how this page's last change went; once protection is turned
  // on or off elsewhere it no longer holds.
  const status = $("protection-status");
  if (!$("protection-on").disabled && status.dataset.on !== String(protection)) status.hidden = true;
  const sip = await sipState();
  $("sip-on").checked = sip === "on";
  $("sip-on").disabled = sip === "missing";
  $("sip-budget").disabled = sip !== "on";
  $("youtube-quality").disabled = sip !== "on";
  for (const id of ["sip-open", "sip-show"]) $(id).disabled = sip !== "on";
  const summary = sip === "on" ? await readSipSummary() : null;
  $("sip-status").hidden = !summary;
  if (summary) $("sip-status").textContent = `${summary.text.hero} · ${summary.text.renews}`;
  if (sip === "on") {
    const { budgetGB, period } = await readSipBudget();
    if (document.activeElement !== $("budget-gb")) $("budget-gb").value = budgetGB || "";
    // A period of every N days is set in Sip's own settings.
    const monthly = period.kind !== "days";
    $("reset-day").disabled = !monthly;
    $("day-note").hidden = monthly;
    if (monthly && document.activeElement !== $("reset-day")) $("reset-day").value = period.day;
    if (document.activeElement !== $("youtube-quality")) $("youtube-quality").value = String(await readSipYoutube());
  }
}

$("protection-on").addEventListener("change", async event => {
  const box = event.target;
  const status = $("protection-status");
  box.disabled = true;
  status.hidden = false;
  status.className = "status";
  status.textContent = tr(box.checked ? "astrelle-turning-on" : "astrelle-turning-off");
  try {
    await setProtection(box.checked);
    status.textContent = tr(box.checked ? "astrelle-protection-on" : "astrelle-protection-off");
    status.dataset.on = box.checked;
  } catch (e) {
    console.error("Astrelle settings: protection", e);
    status.dataset.on = false;
    status.className = "status error";
    status.textContent = tr("astrelle-download-failed");
  }
  box.disabled = false;
  refreshAddons();
});

$("sip-on").addEventListener("change", async event => {
  event.target.disabled = true;
  try {
    await setSip(event.target.checked);
    // An empty budget leaves the one Sip already has.
    if (event.target.checked && Number($("budget-gb").value) > 0) await saveSipBudget($("budget-gb").value, $("reset-day").disabled ? undefined : $("reset-day").value);
  } catch (e) {
    console.error("Astrelle settings: Sip", e);
  }
  refreshAddons();
});

for (const id of ["budget-gb", "reset-day"]) {
  $(id).addEventListener("change", async () => {
    const saved = await saveSipBudget($("budget-gb").value, $("reset-day").disabled ? undefined : $("reset-day").value);
    // What was saved (a day past the 31st is the 31st), even while still in the field.
    if (id === "budget-gb") $(id).value = saved.budgetGB || "";
    else if (saved.day) $(id).value = saved.day;
  });
}

$("youtube-quality").addEventListener("change", () => saveSipYoutube($("youtube-quality").value));
$("sip-open").addEventListener("click", () => openSip(window.browsingContext.topChromeWindow));
$("sip-show").addEventListener("click", () => showSipButton());
$("used-set").addEventListener("click", async event => {
  event.preventDefault();
  const status = $("used-status");
  status.hidden = false;
  status.className = "status";
  const ok = await saveSipUsedSoFar($("used-so-far").value);
  status.textContent = tr(ok ? "astrelle-sip-used-saved" : "astrelle-sip-used-invalid");
  if (!ok) status.className = "status error";
  if (ok) $("used-so-far").value = "";
});

const addonListener = { onEnabled: refreshAddons, onDisabled: refreshAddons, onInstalled: refreshAddons, onUninstalled: refreshAddons };
AddonManager.addAddonListener(addonListener);
const stopFollowingSip = followSipSettings(refreshAddons);

// ---- The disk cache (sizes in KB, as Firefox stores them) ----

const CACHE = "browser.cache.disk.capacity";
const showCache = () => ($("cache-size").value = String(Services.prefs.getIntPref(CACHE, 1048576)));
$("cache-size").addEventListener("change", event => Services.prefs.setIntPref(CACHE, Number(event.target.value)));
Services.prefs.addObserver(CACHE, showCache);
window.addEventListener("unload", () => Services.prefs.removeObserver(CACHE, showCache), { once: true });
showCache();

// ---- More ----

for (const button of document.querySelectorAll("[data-open]")) {
  button.addEventListener("click", () => window.browsingContext.topChromeWindow.openTrustedLinkIn(button.dataset.open, "tab"));
}

// Firefox's panel for choosing the sidebar's tools (the gear opens this page instead).
$("sidebar-tools").addEventListener("click", () => window.browsingContext.topChromeWindow.aetherCustomizeSidebar());

window.addEventListener("unload", () => {
  for (const pref of WATCHED) Services.prefs.removeObserver(pref, refresh);
  Services.prefs.removeObserver(WALLPAPER, wallpaperChanged);
  AddonManager.removeAddonListener(addonListener);
  stopFollowingSip();
}, { once: true });

refresh();
refreshAddons();
buildWallpapers();

// ---- Language: the system's, or any Firefox comes in (each in its own name), in a list that
// folds open with a search box ----

const systemLocale = () => Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).systemLocales[0] ?? "en-US";
// Lower case without accents or punctuation, so "francais" finds "français" and "pt br" finds pt-BR.
const plain = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
let active = -1; // the highlighted language, an index into the visible ones

function buildLanguages() {
  const here = new Intl.DisplayNames([Services.locale.appLocaleAsBCP47], { type: "language" });
  const english = new Intl.DisplayNames(["en"], { type: "language" });
  const chosen = Services.prefs.getStringPref("intl.locale.requested", "").split(",")[0];
  const choices = LOCALES.map(locale => ({ locale, name: nameOf(locale), local: here.of(locale) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const system = { locale: "", name: tr("astrelle-language-system", { language: nameOf(firefoxLocaleFor(systemLocale()) ?? systemLocale()) }) };
  $("language-list").replaceChildren(...[system, ...choices].map(({ locale, name, local }, i) => {
    const item = document.createElement("li");
    item.id = `language-${i}`;
    item.role = "option";
    item.dataset.value = locale;
    item.dataset.search = " " + plain([name, local, locale && english.of(locale), locale].filter(Boolean).join(" "));
    item.ariaSelected = String(locale === chosen);
    const label = Object.assign(document.createElement("span"), { textContent: name });
    if (locale) label.lang = locale;
    item.append(label);
    if (local && local !== name) item.append(Object.assign(document.createElement("small"), { textContent: local }));
    return item;
  }));
  $("language-name").textContent = $("language-list").querySelector('[aria-selected="true"]')?.firstChild.textContent ?? system.name;
}

const visibleLanguages = () => [...$("language-list").children].filter(item => !item.hidden);

function highlight(index) {
  const items = visibleLanguages();
  for (const item of items) item.toggleAttribute("active", false);
  active = items.length ? Math.max(0, Math.min(index, items.length - 1)) : -1;
  const item = items[active];
  item?.toggleAttribute("active", true);
  item?.scrollIntoView({ block: "nearest" });
  $("language-search").setAttribute("aria-activedescendant", item?.id ?? "");
}

function foldLanguages(open) {
  $("language-panel").hidden = !open;
  $("language-current").ariaExpanded = String(open);
  if (!open) return;
  $("language-search").value = "";
  filterLanguages();
  const items = visibleLanguages();
  highlight(Math.max(0, items.findIndex(item => item.ariaSelected === "true")));
  $("language-search").focus();
}

function filterLanguages() {
  // Each word typed starts a word of the language's names: "en" finds English, not French.
  const words = plain($("language-search").value).split(" ").filter(Boolean);
  for (const item of $("language-list").children) item.hidden = !words.every(word => item.dataset.search.includes(" " + word));
  $("language-none").hidden = visibleLanguages().length > 0;
  highlight(0);
}

async function chooseLanguage(chosen) {
  foldLanguages(false);
  $("language-current").focus();
  const status = $("language-status");
  const locale = firefoxLocaleFor(chosen || systemLocale());
  status.hidden = false;
  status.className = "status";
  try {
    if (locale && !locale.startsWith("en") && !(await hasFirefoxStrings(locale))) {
      status.textContent = tr("astrelle-language-downloading");
      await installLanguage(locale);
    }
    setLanguage(chosen);
    buildLanguages();
    status.textContent = tr("astrelle-language-restart-needed");
    $("language-restart").hidden = false;
  } catch (e) {
    console.error("Astrelle settings: language", e);
    status.className = "status error";
    status.textContent = tr("astrelle-language-failed");
  }
}

$("language-current").addEventListener("click", () => foldLanguages($("language-panel").hidden));
$("language-search").addEventListener("input", filterLanguages);
$("language-search").addEventListener("keydown", event => {
  const step = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 }[event.key];
  if (step) highlight(active + step);
  else if (event.key === "Enter" && active >= 0) chooseLanguage(visibleLanguages()[active].dataset.value);
  else if (event.key === "Escape") { foldLanguages(false); $("language-current").focus(); }
  else return;
  event.preventDefault();
});
$("language-list").addEventListener("click", event => {
  const item = event.target.closest("li");
  if (item) chooseLanguage(item.dataset.value);
});
$("language-list").addEventListener("pointermove", event => {
  const item = event.target.closest("li");
  if (item && !item.hasAttribute("active")) highlight(visibleLanguages().indexOf(item));
});
// Clicking anywhere else folds the list away.
document.addEventListener("pointerdown", event => {
  if (!$("language-panel").hidden && !event.target.closest(".languages")) foldLanguages(false);
});
$("language-restart").addEventListener("click", restart);
buildLanguages();

// The app icon cards and their colours (scripts/icon-picker.mjs).
setUpIconPicker(document, window);
