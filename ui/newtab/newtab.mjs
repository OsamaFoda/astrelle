// Astrelle's new tab page: a search box, shortcuts (most visited, with pins and removals that
// stick) and the data use Sip reports. This page is part of the browser (chrome://), so it can
// read history and Sip's storage directly; everything it shows from sites is set as text.

const { NewTabUtils } = ChromeUtils.importESModule("resource://gre/modules/NewTabUtils.sys.mjs");
const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
const { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
const { BrowserUtils } = ChromeUtils.importESModule("resource://gre/modules/BrowserUtils.sys.mjs");
import { follow } from "../scripts/palette.mjs";
import { iconURL } from "../scripts/app-icon.mjs";
import { wallpaperURL } from "../scripts/wallpaper.mjs";
import { followSipSettings, openSip, readSipSummary } from "../scripts/choices.mjs";
import { SIP_ID } from "../scripts/sip.mjs";
import { tr } from "../scripts/l10n.mjs";

const PINNED = "aether.newtab.pinned"; // [{ url, title }]
const HIDDEN = "aether.newtab.hidden"; // [site] (siteOf; older entries are whole URLs)
const SHORTCUTS = 8;

const $ = id => document.getElementById(id);

document.querySelector('link[rel="icon"]').href = iconURL();
const chromeWindow = () => window.browsingContext.topChromeWindow;

function readList(pref) {
  try {
    return JSON.parse(Services.prefs.getStringPref(pref, "[]"));
  } catch {
    return [];
  }
}

function writeList(pref, list) {
  Services.prefs.setStringPref(pref, JSON.stringify(list));
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// What a removal hides: the whole site, as the shortcuts show one page per site and another page
// of a removed one would take its place. Addresses without a host (file:) stand for themselves.
const siteOf = url => hostOf(url) || url;

// Where any link would open for this click: a middle-click or Ctrl in a new tab, Shift in a new
// window.
function open(url, event) {
  chromeWindow().openTrustedLinkIn(url, BrowserUtils.whereToOpenLink(event));
}

// ---- Search ----

// Firefox's own address-or-search decision, so "node.js tutorial" is a search and
// "localhost:8000" an address, exactly as in the address bar.
function destination(text) {
  const flags = Ci.nsIURIFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP | Ci.nsIURIFixup.FIXUP_FLAG_FIX_SCHEME_TYPOS;
  return Services.uriFixup.getFixupURIInfo(text, flags).preferredURI.spec;
}

$("search").addEventListener("submit", event => {
  event.preventDefault();
  const text = $("query").value.trim();
  if (text) open(destination(text));
});

// ---- Shortcuts ----

async function shortcuts() {
  const pinned = readList(PINNED);
  const hidden = new Set(readList(HIDDEN));
  const taken = new Set(pinned.map(s => s.url));
  let top = [];
  try {
    top = await NewTabUtils.activityStreamLinks.getTopSites({ numItems: 24 });
  } catch (e) {
    console.error("Astrelle new tab: top sites", e);
  }
  const visited = top
    .filter(s => s.url && !hidden.has(s.url) && !hidden.has(siteOf(s.url)) && !taken.has(s.url))
    .map(s => ({ url: s.url, title: s.title || hostOf(s.url) }));
  return [...pinned.map(s => ({ ...s, pinned: true })), ...visited].slice(0, SHORTCUTS);
}

async function hasIcon(url) {
  try {
    return Boolean(await PlacesUtils.favicons.getFaviconForPage(Services.io.newURI(url)));
  } catch {
    return false;
  }
}

function togglePin(site) {
  const pinned = readList(PINNED).filter(s => s.url !== site.url);
  if (!site.pinned) pinned.push({ url: site.url, title: site.title });
  writeList(PINNED, pinned);
}

function remove(site) {
  writeList(PINNED, readList(PINNED).filter(s => s.url !== site.url));
  writeList(HIDDEN, [...new Set([...readList(HIDDEN), siteOf(site.url)])]);
}

// Drawn again whenever the pins or removals change (here or on another New Tab page) and when the
// page comes back into view, for the sites visited since; unchanged shortcuts are left as they are.
let shortcutsAsked = 0;
let shown = "";
async function renderShortcuts() {
  const asked = ++shortcutsAsked;
  const sites = await shortcuts();
  if (asked !== shortcutsAsked) return; // a newer list is on its way
  if (JSON.stringify(sites) === shown) return;
  shown = JSON.stringify(sites);
  const template = $("tile").content;
  $("shortcuts").replaceChildren(...sites.map(site => {
    const tile = template.firstElementChild.cloneNode(true);
    tile.toggleAttribute("pinned", Boolean(site.pinned));

    const link = tile.querySelector(".link");
    // A real link, so the Tab key reaches it and right-clicking gives the link menu. Its own
    // navigation is cancelled, so a click opens the site once, through open().
    link.href = site.url;
    link.title = site.url;
    const openSite = event => { event.preventDefault(); open(site.url, event); };
    link.addEventListener("click", openSite);
    link.addEventListener("auxclick", event => { if (event.button === 1) openSite(event); });

    const icon = tile.querySelector(".icon");
    const letter = tile.querySelector(".letter");
    letter.textContent = (hostOf(site.url)[0] || "?").toUpperCase();
    const showLetter = () => { icon.hidden = true; letter.hidden = false; };
    icon.addEventListener("error", showLetter);
    // Firefox draws a generic globe for sites with no saved icon; show the site's letter instead.
    hasIcon(site.url).then(found => { if (found) icon.src = `page-icon:${site.url}`; else showLetter(); });

    tile.querySelector(".title").textContent = site.title;
    const pin = tile.querySelector(".pin");
    pin.textContent = "📌";
    pin.title = tr(site.pinned ? "astrelle-newtab-unpin" : "astrelle-newtab-pin");
    pin.addEventListener("click", () => togglePin(site));
    tile.querySelector(".remove").addEventListener("click", () => remove(site));
    return tile;
  }));
  $("no-shortcuts").hidden = sites.length > 0;
}

// ---- Data use, from Sip's summary ----
// Sip publishes a summary after every change (its lib/summary.js), with every text already in
// its language; the card shows those texts and draws the bar from its figures.

const today = () => {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

async function renderData() {
  let summary = null;
  try {
    if (WebExtensionPolicy.getByID(SIP_ID)) summary = await readSipSummary();
  } catch (e) {
    console.error("Astrelle new tab: Sip data", e);
  }
  const card = $("data");
  if (!summary) {
    card.hidden = true;
    return;
  }
  card.lang = summary.lang;
  card.dir = summary.dir;
  $("data-hero").textContent = summary.text.hero;
  $("budget").hidden = !summary.hasBudget;
  if (summary.hasBudget) {
    const used = Math.min(1, Math.max(0, summary.ratio));
    const ends = summary.projRatio === null ? used : Math.min(1, Math.max(used, summary.projRatio));
    $("bar-fill").style.width = `${used * 100}%`;
    $("bar-proj").style.insetInlineStart = `${used * 100}%`;
    $("bar-proj").style.width = `${(ends - used) * 100}%`;
    $("bar").className = `bar ${{ warn: "warn", danger: "danger", over: "danger" }[summary.level] ?? ""}`;
    $("bar").setAttribute("aria-valuenow", String(Math.round(used * 100)));
    $("bar").setAttribute("aria-valuetext", summary.text.left);
    $("data-renews").textContent = `${summary.text.renews} · ${summary.text.days}`;
    const pill = $("pace-pill");
    pill.textContent = summary.text.paceShort;
    pill.hidden = !summary.text.paceShort;
    pill.className = `pill ${{ fast: "warn", over: "danger" }[summary.pace] ?? ""}`;
  }
  // Today's lines belong to the day the summary was made.
  const fresh = summary.day === today();
  $("today-lines").hidden = !fresh;
  $("data-today").textContent = fresh ? summary.text.today : "";
  $("data-over").textContent = fresh ? summary.text.over : "";
  $("data-over").hidden = !fresh || !summary.text.over;
  card.hidden = false;
}

$("data").addEventListener("click", () => openSip(chromeWindow()));
$("data").addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openSip(chromeWindow());
  }
});
const stopFollowingSip = followSipSettings(renderData);
window.addEventListener("unload", stopFollowingSip, { once: true });

follow(document, window);
// In a private window, purple like the window (styles/palettes.css).
const isPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
if (isPrivate) document.documentElement.setAttribute("privatebrowsingmode", "temporary");

// ---- The window's wallpaper, drawn here to line up with it (newtab.css, [aether-wallpaper]) ----

// Asked again when the window's is (scripts/wallpaper.mjs): on these prefs, and, as the desktop's
// wallpaper can differ for light and dark or change while away, when the window turns light or
// dark and when it comes forward.
const WALLPAPER_PREFS = ["aether.liquidGlass", "aether.background", "aether.wallpaper"];
let wallpaperAsked = 0;
let wallpaperStale = false;
async function showWallpaper() {
  const asked = ++wallpaperAsked;
  wallpaperStale = false;
  const on = Services.prefs.getBoolPref("aether.liquidGlass", false) &&
    Services.prefs.getStringPref("aether.background", "wallpaper") === "wallpaper";
  // A private window ignores the chosen wallpaper for its theme's (styles/aether.css).
  const url = on && (isPrivate ? "theme" : await wallpaperURL(chromeWindow()));
  if (asked !== wallpaperAsked) return; // a newer look is on its way
  const root = document.documentElement;
  if (!url) root.removeAttribute("aether-wallpaper");
  else root.setAttribute("aether-wallpaper", url === "theme" ? "theme" : "picture");
  if (url && url !== "theme") root.style.setProperty("--aether-wallpaper", `url("${url.replaceAll('"', "%22")}")`);
  else root.style.removeProperty("--aether-wallpaper");
  startPlacing();
}
// Where the window is, relative to this page, checked each frame while the page shows the
// wallpaper (the page slides in compact mode, which nothing reports). Otherwise no frames are
// asked for, as each one keeps the whole browser window busy.
let placed = "";
let placing = false;
function placeWallpaper() {
  placing = document.documentElement.hasAttribute("aether-wallpaper") && !document.hidden;
  if (!placing) return;
  const top = chromeWindow();
  // The window's pixels in this page's, which are bigger when the page is zoomed.
  const k = top.devicePixelRatio / window.devicePixelRatio;
  const at = [top.mozInnerScreenX * k - window.mozInnerScreenX, top.mozInnerScreenY * k - window.mozInnerScreenY,
    top.innerWidth * k, top.innerHeight * k].map(n => `${Math.round(n)}px`);
  if (at.join() !== placed) {
    placed = at.join();
    ["--wall-x", "--wall-y", "--wall-w", "--wall-h"].forEach((name, i) => document.documentElement.style.setProperty(name, at[i]));
  }
  requestAnimationFrame(placeWallpaper);
}
const startPlacing = () => { if (!placing) placeWallpaper(); };
// A page in a tab behind asks when it's next shown, not on every return to the window (with the
// desktop's wallpaper, each ask runs gsettings).
const refreshWallpaper = () => {
  if (document.hidden) wallpaperStale = true;
  else showWallpaper();
};
const windowAround = chromeWindow();
const windowDark = windowAround.matchMedia("(prefers-color-scheme: dark)");
// Whether the window's picture is dark or light overall (scripts/wallpaper.mjs works it out), for
// the page's text on it (newtab.css, [aether-wallpaper-tone]).
const followTone = () => {
  const tone = windowAround.document.documentElement.getAttribute("aether-wallpaper-tone");
  if (tone) document.documentElement.setAttribute("aether-wallpaper-tone", tone);
  else document.documentElement.removeAttribute("aether-wallpaper-tone");
};
const toneWatcher = new windowAround.MutationObserver(followTone);
toneWatcher.observe(windowAround.document.documentElement, { attributes: true, attributeFilter: ["aether-wallpaper-tone"] });
followTone();
WALLPAPER_PREFS.forEach(pref => Services.prefs.addObserver(pref, showWallpaper));
windowAround.addEventListener("activate", refreshWallpaper);
windowDark.addEventListener("change", refreshWallpaper);
[PINNED, HIDDEN].forEach(pref => Services.prefs.addObserver(pref, renderShortcuts));
window.addEventListener("unload", () => {
  WALLPAPER_PREFS.forEach(pref => Services.prefs.removeObserver(pref, showWallpaper));
  windowAround.removeEventListener("activate", refreshWallpaper);
  windowDark.removeEventListener("change", refreshWallpaper);
  toneWatcher.disconnect();
  [PINNED, HIDDEN].forEach(pref => Services.prefs.removeObserver(pref, renderShortcuts));
}, { once: true });
document.addEventListener("visibilitychange", startPlacing);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  if (wallpaperStale) showWallpaper();
  renderShortcuts();
  renderData();
});
showWallpaper();
renderShortcuts();
renderData();
