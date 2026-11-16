// timeout: 120
// In every language Astrelle is translated into (one Spanish serving all four of Firefox's), its
// pages come up in that language: welcome, Settings and New Tab, with every label translated.
const wait = ms => new Promise(r => setTimeout(r, ms));
const { TRANSLATIONS } = ChromeUtils.importESModule("chrome://aether/content/scripts/astrelle-locales.mjs");
const pages = ["chrome://aether/content/welcome/welcome.html", "about:astrelle", "chrome://aether/content/newtab/newtab.html"];
const problems = {};
const english = {};
for (const locales of Object.values(TRANSLATIONS)) {
  for (const locale of locales) {
    Services.locale.requestedLocales = [locale];
    await wait(300);
    for (const url of pages) {
      const tab = gBrowser.selectedTab = gBrowser.addTrustedTab(url);
      await wait(1500);
      const doc = tab.linkedBrowser.contentDocument;
      const ids = [...new Set([...doc.querySelectorAll("[data-l10n-id]")].map(el => el.dataset.l10nId))];
      // Formatted in this language only: a message missing here would otherwise come out in English.
      const resources = [...doc.querySelectorAll('link[rel="localization"]')].map(link => link.getAttribute("href"));
      const only = new Localization(resources, false, undefined, [locale]);
      const messages = await only.formatMessages(ids.map(id => ({ id })));
      const missing = ids.filter((id, i) => !messages[i]);
      const title = doc.title;
      if (locale === "en-US") english[url] = title;
      if (missing.length || doc.documentElement.lang !== locale || (locale !== "en-US" && title === english[url]))
        problems[`${locale} ${url.split("/").pop()}`] = { lang: doc.documentElement.lang, title, missing: missing.slice(0, 5) };
      gBrowser.removeTab(tab);
    }
  }
}
Services.locale.requestedLocales = ["en-US"];
return { ok: Object.keys(problems).length === 0, problems };
