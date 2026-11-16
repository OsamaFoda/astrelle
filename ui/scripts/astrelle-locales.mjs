// The languages Astrelle's own strings are translated into (ui/locales/<folder>/), and which of
// Firefox's languages each serves: one Spanish for Spain and Latin America. Firefox's other
// languages show Astrelle's parts in English. Read by boot.sys.mjs and scripts/langpack-brand.mjs.
export const TRANSLATIONS = {
  "en-US": ["en-US"],
  ar: ["ar"],
  de: ["de"],
  es: ["es-ES", "es-MX", "es-AR", "es-CL"],
  fr: ["fr"],
  it: ["it"],
  ja: ["ja"],
  "pt-BR": ["pt-BR"],
  ru: ["ru"],
  tr: ["tr"],
  "zh-CN": ["zh-CN"],
};

// The folder with a language's strings, or null for one Astrelle isn't translated into.
export const folderFor = locale => Object.keys(TRANSLATIONS).find(folder => TRANSLATIONS[folder].includes(locale)) ?? null;
