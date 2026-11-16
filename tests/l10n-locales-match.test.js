// Astrelle's own strings: every translation (scripts/astrelle-locales.mjs) has exactly the
// messages English has, attributes included, so none silently falls back or shows a missing one.
const { TRANSLATIONS } = ChromeUtils.importESModule("chrome://aether/content/scripts/astrelle-locales.mjs");
const BASE = "chrome://aether/content/locales/";
const ids = async url => {
  const text = await (await fetch(url)).text();
  const out = new Set();
  let message = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^(-?[a-z0-9-]+) *=/);
    if (m) { message = m[1]; out.add(message); continue; }
    const a = line.match(/^ +\.([a-z-]+) *=/);
    if (a && message) out.add(`${message}.${a[1]}`);
  }
  return out;
};
const files = ["astrelle/browser", "astrelle/newtab", "astrelle/settings", "astrelle/welcome", "toolkit/branding/brandings"];
const problems = {};
for (const file of files) {
  const english = await ids(`${BASE}en-US/${file}.ftl`);
  for (const locale of Object.keys(TRANSLATIONS).filter(folder => folder !== "en-US")) {
    const other = await ids(`${BASE}${locale}/${file}.ftl`);
    const missing = [...english].filter(id => !other.has(id));
    const extra = [...other].filter(id => !english.has(id));
    if (missing.length || extra.length) problems[`${locale} ${file}`] = { missing, extra };
  }
}
return { ok: Object.keys(problems).length === 0, problems };
