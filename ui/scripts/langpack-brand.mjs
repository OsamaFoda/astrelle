// Astrelle's name in Mozilla's language packs. A pack (scripts/languages.mjs downloads them) brings
// Firefox's menus in its language, but its own branding too: "Mozilla Firefox", Firefox's feature
// names, the Firefox trademark line. Fluent never mixes a pack's files with Astrelle's, so they
// can't simply be outranked. As each pack starts, its registration is replaced by one listing
// every file but those two (branding/brand.ftl, toolkit/branding/brandings.ftl), and Astrelle's
// own are added to the pack's group: the brand name (the same in every language) and its feature
// names in that language (ui/locales/<locale>/toolkit/branding/brandings.ftl, English where there's
// no translation yet). Registered once, by boot.sys.mjs, before any window.

const BASE = "chrome://aether/content/";
const BRAND = "branding/brand.ftl";
const BRANDINGS = "toolkit/branding/brandings.ftl";
import { folderFor } from "./astrelle-locales.mjs";

// The files a pack has under one of its sources' localization folders, as the URLs Fluent asks
// for: read from the pack's own zip.
function packFiles(langpack, basePath, locale) {
  const zip = langpack.rootURI.QueryInterface(Ci.nsIJARURI).JARFile.QueryInterface(Ci.nsIFileURL).file;
  const reader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
  reader.open(zip);
  try {
    const prefix = `${basePath}localization/${locale}/`;
    const names = [];
    for (const name of reader.findEntries(`${prefix}*`)) if (name.endsWith(".ftl")) names.push(name.slice(prefix.length));
    return names;
  } finally {
    reader.close();
  }
}

function rebrand(langpack) {
  const registry = L10nRegistry.getInstance();
  const id = langpack.langpackId;
  const locales = langpack.startupData.languages;
  const replaced = [];
  for (const [sourceName, basePath] of Object.entries(langpack.startupData.l10nRegistrySources)) {
    const name = `${sourceName}-${id}`;
    const prePath = `resource://${id}/${basePath}localization/{locale}/`;
    const index = locales.flatMap(locale => packFiles(langpack, basePath, locale)
      .filter(file => file !== BRAND && file !== BRANDINGS)
      .map(file => prePath.replace("{locale}", locale) + file));
    replaced.push(new L10nFileSource(name, id, locales, prePath, {}, index));
  }
  registry.updateSources(replaced);
  const own = `astrelle-${id}`;
  registry.removeSources(registry.getSourceNames().filter(name => name.startsWith(own)));
  // Fluent finds a file at its source's base path plus its name, so the brand name (one file for
  // every language) and each language's feature names are sources of their own.
  registry.registerSources([
    new L10nFileSource(`${own}-brand`, id, locales, BASE, {}, [`${BASE}branding/brand.ftl`]),
    ...locales.map(locale => {
      const folder = `${BASE}locales/${folderFor(locale) ?? "en-US"}/`;
      return new L10nFileSource(`${own}-${locale}`, id, [locale], folder, {}, [folder + BRANDINGS]);
    }),
  ]);
}

let started = false;
export function init() {
  if (started) return;
  started = true;
  Services.obs.addObserver(subject => {
    try {
      rebrand(subject.wrappedJSObject.langpack);
    } catch (e) {
      console.error("Astrelle: language pack branding", e);
    }
  }, "webextension-langpack-startup");
}
