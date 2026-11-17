// Applies Astrelle's interface to every browser window: stylesheets as soon as a window's
// document exists (so there's no flash of plain Firefox), scripts once the window is ready.

const BASE = "chrome://aether/content/";
const BROWSER_WINDOW = "chrome://browser/content/browser.xhtml";

const STYLES = ["styles/palettes.css", "styles/aether.css"];
const SCRIPTS = ["scripts/palette.mjs", "scripts/app-icon.mjs", "scripts/sidebar-urlbar.mjs", "scripts/tab-close.mjs", "scripts/tab-lens.mjs", "scripts/new-tab-position.mjs", "scripts/compact-mode.mjs", "scripts/hover-glass.mjs", "scripts/newtab.mjs", "scripts/peek.mjs", "scripts/workspaces.mjs", "scripts/split-view.mjs", "scripts/media-controls.mjs", "scripts/notification-bars.mjs", "scripts/liquid-glass.mjs", "scripts/wallpaper.mjs", "scripts/sip.mjs", "scripts/welcome.mjs", "scripts/languages.mjs", "scripts/about-aether.mjs", "scripts/customize-sidebar.mjs", "scripts/sidebar-panels.mjs", "scripts/toolbar.mjs"];

// The brand name in Firefox's Fluent strings (branding/brand.ftl), from ui/branding/ (see
// chrome.manifest). It's the only file there, so Firefox doesn't look in ui/ for the others.
// Astrelle's own strings (ui/locales/<folder>/astrelle/*.ftl), one source per translation, each
// serving the Firefox languages it's for (scripts/astrelle-locales.mjs); for anything else
// Firefox falls back to English. English also has Astrelle's names for Firefox's features
// (toolkit/branding/brandings.ftl); with a language pack, the pack's language gets its own
// (scripts/langpack-brand.mjs, which also rebrands each pack as it starts, before any window).
const { TRANSLATIONS } = ChromeUtils.importESModule(BASE + "scripts/astrelle-locales.mjs");
const STRINGS = ["browser", "newtab", "settings", "welcome"];
ChromeUtils.importESModule(BASE + "scripts/langpack-brand.mjs").init();
L10nRegistry.getInstance().registerSources([
  new L10nFileSource("astrelle-brand", "app", Services.locale.packagedLocales, BASE, {}, [BASE + "branding/brand.ftl"]),
  ...Object.entries(TRANSLATIONS).map(([folder, locales]) => {
    const path = `${BASE}locales/${folder}/`;
    const files = STRINGS.map(file => `${path}astrelle/${file}.ftl`);
    if (folder === "en-US") files.push(`${path}toolkit/branding/brandings.ftl`);
    return new L10nFileSource(`astrelle-${folder}`, "app", locales, path, {}, files);
  }),
]);

function addStyles(win) {
  for (const sheet of STYLES) {
    win.windowUtils.loadSheetUsingURIString(BASE + sheet, win.windowUtils.AUTHOR_SHEET);
  }
}

async function runScripts(win) {
  for (const script of SCRIPTS) {
    try {
      const module = ChromeUtils.importESModule(BASE + script);
      await module.init(win);
    } catch (e) {
      console.error(`Astrelle: ${script} failed`, e);
    }
  }
}

Services.obs.addObserver(subject => {
  subject.addEventListener("DOMContentLoaded", () => {
    if (subject.location.href === BROWSER_WINDOW) addStyles(subject);
  }, { once: true });
}, "domwindowopened");

Services.obs.addObserver(win => runScripts(win), "browser-delayed-startup-finished");
