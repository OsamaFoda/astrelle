// Frosted Glass for compact mode's sidebar (or top toolbar) when it hovers over the page (aether.compactReveal
// "over"): what's behind it then is the website, not the wallpaper, and Firefox's glass can't blur
// a web page. So the page as it's showing is snapshotted, at a quarter of its size, and the strip
// under the bar is cut out of it, blurred, and drawn behind the bar's frost, staying where that
// strip is on the screen while the bar slides over it, as glass over the page would. Taken as the bar starts to come in, then four times a second while it's
// out, so a page that scrolls or plays shows through. (Sliding beside the page, the wallpaper is
// behind it and the glass blurs that itself.) Styles: aether.css.
//
// The picture is only ever in memory, in this window, and wiped the moment the bar is gone. Not in
// private windows at all: there the bar hovering over the page is solid.

const { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");

const ID = "aether-hover-backdrop";
const SCALE = 0.25;
const BLUR = 4; // px of the small picture: about 16 of the page's
const EVERY = 250; // ms, while it's out
const PATIENCE = 1000; // ms: a picture not taken by then is given up on, so the next can be

export function init(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const sidebar = doc.getElementById("sidebar-container");
  const toolbox = doc.getElementById("navigator-toolbox");
  if (!sidebar || !toolbox || !doc.mozSetImageElement || PrivateBrowsingUtils.isWindowPrivate(win)) return;
  // The bar that hovers: the sidebar, or with tabs on top the toolbar.
  const bar = () => (root.hasAttribute("aether-vertical") ? sidebar : toolbox);

  // Drawn off the page: the sidebar shows it through -moz-element(#aether-hover-backdrop).
  const canvas = doc.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  const context = canvas.getContext("2d");
  doc.mozSetImageElement(ID, canvas);

  const wanted = () => ["aether-compact", "aether-over", "aether-liquid"].every(a => root.hasAttribute(a)) &&
    !root.hasAttribute("inFullscreen") && !root.hasAttribute("inDOMFullscreen");
  const out = () => {
    const r = bar().getBoundingClientRect();
    return root.hasAttribute("aether-vertical") ? r.right > 0 : r.bottom > 8; // (hidden, the toolbar rests 8 px down)
  };

  // Wiped: the canvas emptied (a 1-pixel one), and any picture still being taken thrown away.
  let wipes = 0;
  function wipe() {
    wipes++;
    canvas.width = canvas.height = 1;
    root.removeAttribute("aether-hover-backdrop");
  }

  let busy = false;
  async function snapshot() {
    if (busy || !wanted()) return;
    const browser = win.gBrowser.selectedBrowser;
    const page = browser?.getBoundingClientRect();
    const global = browser?.browsingContext?.currentWindowGlobal;
    if (!page?.width || !global) return;
    // The part of the page under the bar when it's out (its slide aside: both are fixed, so their
    // offsets are where they rest), on the screen, and in the page's showing part.
    const el = bar();
    const x1 = Math.max(el.offsetLeft, page.left), y1 = Math.max(el.offsetTop, page.top);
    const x2 = Math.min(el.offsetLeft + el.offsetWidth, page.right), y2 = Math.min(el.offsetTop + el.offsetHeight, page.bottom);
    if (x2 <= x1 || y2 <= y1) return;
    el.style.setProperty("--aether-hover-at", `${x1 - el.offsetLeft}px ${y1 - el.offsetTop}px`);
    el.style.setProperty("--aether-hover-size", `${x2 - x1}px ${y2 - y1}px`);
    busy = true;
    const asked = wipes;
    const giveUp = win.setTimeout(() => (busy = false), PATIENCE);
    try {
      // The whole of what's showing (a region would be measured from the page's top, not from
      // where it's scrolled to), then the strip cut out of it, blurred: a little past its edges,
      // so the blur has the page to draw on there too.
      const picture = await global.drawSnapshot(null, SCALE, "white");
      if (asked !== wipes) return picture.close(); // the bar went while it was being taken
      const w = Math.max(1, Math.round((x2 - x1) * SCALE)), h = Math.max(1, Math.round((y2 - y1) * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const pad = BLUR * 3;
      const sx = (x1 - page.left) * SCALE - pad, sy = (y1 - page.top) * SCALE - pad;
      context.filter = `blur(${BLUR}px)`;
      context.drawImage(picture, sx, sy, w + 2 * pad, h + 2 * pad, -pad, -pad, w + 2 * pad, h + 2 * pad);
      picture.close();
      root.setAttribute("aether-hover-backdrop", "");
    } catch {
      // A page that can't be drawn (still loading, or gone): the frost alone, solid.
      root.removeAttribute("aether-hover-backdrop");
    } finally {
      win.clearTimeout(giveUp);
      busy = false;
    }
  }

  // As it starts to come in (its slide begins), then while it's out, and no longer: once it's gone,
  // the picture goes too.
  let timer = 0;
  const keepUp = () => {
    if (wanted() && out()) return snapshot();
    win.clearInterval(timer);
    timer = 0;
    wipe();
  };
  for (const el of [sidebar, toolbox]) {
    el.addEventListener("transitionrun", event => {
      if (event.target !== el || el !== bar() || event.propertyName !== "transform" || !wanted()) return;
      snapshot();
      timer ||= win.setInterval(keepUp, EVERY);
    });
  }
  // Another tab under it: a fresh picture now, not in a moment.
  win.gBrowser.tabContainer.addEventListener("TabSelect", () => wanted() && out() && snapshot());
}
