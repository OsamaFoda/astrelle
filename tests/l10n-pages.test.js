// timeout: 60
// Astrelle's pages are translated by Fluent (ui/locales/<locale>/astrelle/*.ftl): each page has its
// localization, and every data-l10n-id on it has a message.
const wait = ms => new Promise(r => setTimeout(r, ms));
const pages = ["chrome://aether/content/newtab/newtab.html", "about:astrelle", "chrome://aether/content/welcome/welcome.html"];
const report = {};
for (const url of pages) {
  const tab = gBrowser.addTrustedTab(url);
  gBrowser.selectedTab = tab;
  await wait(2500);
  const doc = tab.linkedBrowser.contentDocument;
  const ids = [...new Set([...doc.querySelectorAll("[data-l10n-id]")].map(el => el.dataset.l10nId))];
  const messages = doc.l10n ? await doc.l10n.formatMessages(ids.map(id => ({ id }))) : [];
  report[url] = { localized: !!doc.l10n, ids: ids.length, missing: ids.filter((id, i) => !messages[i]), lang: doc.documentElement.lang };
  gBrowser.removeTab(tab);
}
const ok = Object.values(report).every(r => r.localized && r.ids > 0 && !r.missing.length);
return { ok, report };
