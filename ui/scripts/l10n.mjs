// Astrelle's strings for scripts (ui/locales/<locale>/astrelle/browser.ftl), in the browser's
// language, English where a translation is missing. Pages mark their own text with data-l10n-id.
const l10n = new Localization(["astrelle/browser.ftl"], true);

export function tr(id, args) {
  return l10n.formatValueSync(id, args) ?? id;
}
