// timeout: 120
// Text on Astrelle's pages (welcome, Settings, New Tab) reads at 4.5:1 or more against what's
// behind it (3:1 for large text), in light and dark, in the colour themes with the faintest
// accents: accent text uses --accent-ink, buttons --accent-button and --on-accent.
const wait = ms => new Promise(r => setTimeout(r, ms));
const parse = c => { const m = (c.replace(/^color\(srgb/, "").match(/[\d.]+(e-?\d+)?/g) || [0, 0, 0, 0]).map(Number); const k = c.startsWith("color(") ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
const lum = ({ r, g, b }) => { const f = v => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function check(win) {
  const doc = win.document, css = el => win.getComputedStyle(el);
  const probe = doc.createElement("i");
  probe.style.color = css(doc.documentElement).getPropertyValue("--sky-2").trim() || "white";
  doc.body.append(probe);
  const base = parse(css(probe).color);
  probe.remove();
  const failures = [];
  for (const el of doc.querySelectorAll("body *")) {
    if (!el.getClientRects().length || css(el).visibility === "hidden" || el.closest("[hidden], svg, :disabled")) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const layers = [];
    for (let n = el; n && n !== doc.documentElement; n = n.parentElement) layers.unshift(parse(css(n).backgroundColor));
    let behind = base;
    for (const layer of layers) if (layer.a > 0) behind = over(layer, behind);
    const style = css(el), size = parseFloat(style.fontSize), bold = Number(style.fontWeight) >= 700;
    const text = parse(style.color);
    const r = ratio(over(text, behind), behind);
    if (r < (size >= 24 || (bold && size >= 18.66) ? 3 : 4.5)) failures.push(`${r.toFixed(2)} ${el.tagName}:${el.textContent.trim().slice(0, 24)}`);
  }
  return [...new Set(failures)];
}
const out = {};
for (const dark of [0, 1]) {
  Services.prefs.setIntPref("ui.systemUsesDarkTheme", dark);
  for (const palette of ["nebula", "sunset", "aurora"]) {
    Services.prefs.setStringPref("aether.palette", palette);
    for (const url of ["chrome://aether/content/welcome/welcome.html", "about:astrelle", "chrome://aether/content/newtab/newtab.html"]) {
      const tab = gBrowser.selectedTab = gBrowser.addTrustedTab(url);
      await wait(1800);
      const failures = check(tab.linkedBrowser.contentWindow);
      if (failures.length) out[`${dark ? "dark" : "light"} ${palette} ${url.split("/").pop()}`] = failures;
      gBrowser.removeTab(tab);
    }
  }
}
Services.prefs.clearUserPref("ui.systemUsesDarkTheme");
Services.prefs.clearUserPref("aether.palette");
return { ok: Object.keys(out).length === 0, failures: out };
