// Frosted Glass for compact mode's sidebar (or top toolbar) when it hovers over the page (aether.compactReveal
// "over"): what's behind it then is the website, not the wallpaper, and Firefox's glass can't blur
// a web page. So the strip of the page under the sidebar is snapshotted, small (a tenth of its
// size), and drawn stretched back out behind the sidebar's frost: blurred by the stretching, as
// the wallpaper's frosted copy is. Taken as the sidebar starts to come in, then four times a
// second while it's out, so a page that scrolls or plays shows through. (Sliding beside the
// page, the wallpaper is behind it and the glass blurs that itself.) Styles: aether.css.

const ID = "aether-hover-backdrop";
const SCALE = 0.1;
const EVERY = 250; // ms, while it's out

export function init(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const sidebar = doc.getElementById("sidebar-container");
  const toolbox = doc.getElementById("navigator-toolbox");
  if (!sidebar || !toolbox || !doc.mozSetImageElement) return;
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

  let busy = false;
  async function snapshot() {
    if (busy || !wanted()) return;
    const browser = win.gBrowser.selectedBrowser;
    const page = browser?.getBoundingClientRect();
    const global = browser?.browsingContext?.currentWindowGlobal;
    if (!page?.width || !global) return;
    // The part of the page under the bar when it's out (its slide aside: both are fixed, so their
    // offsets are where they rest), in the page's own coordinates, and where that part is on the
    // bar, for its background.
    const el = bar();
    const x1 = Math.max(el.offsetLeft, page.left), y1 = Math.max(el.offsetTop, page.top);
    const x2 = Math.min(el.offsetLeft + el.offsetWidth, page.right), y2 = Math.min(el.offsetTop + el.offsetHeight, page.bottom);
    if (x2 <= x1 || y2 <= y1) return;
    const rect = new win.DOMRect(x1 - page.left, y1 - page.top, x2 - x1, y2 - y1);
    el.style.setProperty("--aether-hover-at", `${x1 - el.offsetLeft}px ${y1 - el.offsetTop}px`);
    el.style.setProperty("--aether-hover-size", `${x2 - x1}px ${y2 - y1}px`);
    busy = true;
    try {
      const picture = await global.drawSnapshot(rect, SCALE, "white");
      if (canvas.width !== picture.width || canvas.height !== picture.height) {
        canvas.width = picture.width;
        canvas.height = picture.height;
      }
      context.drawImage(picture, 0, 0);
      picture.close();
      root.setAttribute("aether-hover-backdrop", "");
    } catch {
      // A page that can't be drawn (still loading, or gone): the frost alone, solid.
      root.removeAttribute("aether-hover-backdrop");
    } finally {
      busy = false;
    }
  }

  // As it starts to come in (its slide begins), then while it's out, and no longer.
  let timer = 0;
  const keepUp = () => {
    if (wanted() && out()) return snapshot();
    win.clearInterval(timer);
    timer = 0;
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
