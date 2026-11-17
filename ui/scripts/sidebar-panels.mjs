// Sidebar panels in Astrelle's look. The panel is a card of glass beside the sidebar, lined up with
// it and the page (styles/aether.css, #sidebar-box). Firefox's own pages inside it (bookmarks,
// history, passwords, the customize page) get transparent backgrounds and the theme's colours
// (styles/sidebar-pages.css); web pages in it, like an add-on's or a chatbot's, keep their own.
//
// Opening a panel shows it in place, fading in, while the page glides aside off it like a drawer
// opening; closing one makes the page glide back over its place instead of jumping. Only things
// moving and fading, which the graphics card does (sizes changing would have the page laid out
// again on every frame of it). In compact mode, closing one sends the sidebar off at once, on the
// same curve, so the two move together.

import { follow } from "./palette.mjs";

const { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");

import { GLIDE, MOVE } from "./motion.mjs";
const SHEETS = ["chrome://aether/content/styles/palettes.css", "chrome://aether/content/styles/sidebar-pages.css"];

export function init(win) {
  // The tools at the bottom of the sidebar: all of them, in one row that scrolls sideways when
  // they don't fit (styles/sidebar-tools.css), with the wheel, and fading at an end with more.
  const main = win.document.querySelector("sidebar-main");
  main?.updateComplete.then(() => {
    main.shadowRoot.append(Object.assign(win.document.createElementNS("http://www.w3.org/1999/xhtml", "link"),
      { rel: "stylesheet", href: "chrome://aether/content/styles/sidebar-tools.css" }));
    const row = () => main.shadowRoot.querySelector(".tools-and-extensions");
    const fade = () => {
      const r = row();
      if (!r) return;
      r.style.setProperty("--aether-fade-start", r.scrollLeft > 1 ? "24px" : "0px");
      r.style.setProperty("--aether-fade-end", r.scrollLeft + r.clientWidth < r.scrollWidth - 1 ? "24px" : "0px");
    };
    main.shadowRoot.addEventListener("wheel", event => {
      const r = row();
      if (!r?.contains(event.target) || r.scrollWidth <= r.clientWidth || event.deltaX) return;
      // A mouse wheel counts in lines (or pages), not pixels, here in the browser's own UI.
      r.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? r.clientWidth : 1);
      event.preventDefault();
    }, { passive: false });
    main.shadowRoot.addEventListener("scroll", fade, true);
    new win.ResizeObserver(fade).observe(main);
    // New icons draw themselves a moment after they're added: measure once they have.
    new win.MutationObserver(() => win.requestAnimationFrame(() => win.requestAnimationFrame(fade)))
      .observe(main.shadowRoot, { childList: true, subtree: true });
    fade();
  });

  const doc = win.document;
  const box = doc.getElementById("sidebar-box");
  const page = doc.getElementById("tabbrowser-tabbox");
  const reducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");
  // In compact mode the sidebar leaves with the page when a panel closes (styles/aether.css,
  // [aether-leaving]). That has to be marked before the panel hides: Firefox may lay the
  // window out on the way, starting the sidebar's usual, delayed exit, which can't be hurried.
  let closing = 0;
  const markClosing = () => {
    if (!doc.documentElement.hasAttribute("aether-compact")) return;
    doc.documentElement.setAttribute("aether-leaving", "");
    win.clearTimeout(closing);
    closing = win.setTimeout(() => doc.documentElement.removeAttribute("aether-leaving"), 700);
  };
  // Where the page was when a panel started opening or closing: where it glides from. (Firefox
  // lays the window out again on the way, so by the time the panel shows or hides it's moved.)
  let from = null;
  for (const name of ["show", "hide", "toggle"]) {
    const firefox = win.SidebarController[name];
    win.SidebarController[name] = function (...args) {
      from = page.getBoundingClientRect().left;
      if (!box.hidden && (name === "hide" || (name === "toggle" && this.currentID === args[0]))) markClosing();
      return firefox.apply(this, args);
    };
  }
  // Runs after the panel shows or hides but before the window is drawn.
  new win.MutationObserver(() => {
    if (box.hidden) markClosing();
    const start = from ?? win.windowUtils.getBoundsWithoutFlushing(page).left;
    from = null;
    if (reducedMotion.matches) return;
    const dx = start - page.getBoundingClientRect().left;
    if (!box.hidden) {
      // From a little way back towards the sidebar (the start of the line: left, or right in
      // Arabic, Hebrew, Persian and Urdu), under the page sliding off it.
      const back = win.getComputedStyle(box).direction === "rtl" ? 16 : -16;
      box.animate([{ opacity: 0, translate: `${back}px 0` }, { opacity: 1, translate: "0 0" }], { duration: MOVE, easing: GLIDE });
    }
    if (Math.abs(dx) >= 1) page.animate([{ translate: `${dx}px 0`, offset: 0 }], { duration: MOVE, easing: GLIDE });
  }).observe(box, { attributes: true, attributeFilter: ["hidden"] });

  // The sidebar's pages load in this process, so their events reach the window.
  win.addEventListener("DOMContentLoaded", event => {
    const page = event.target;
    const view = page.defaultView;
    // Also the boxes asking a question (a name for a workspace, a site's alert), which sit on the
    // window's glass (aether.css, .dialogBox).
    const dialog = page.documentURI === "chrome://global/content/commonDialog.xhtml";
    if (!page.documentURI?.startsWith("chrome://") || (view?.browsingContext?.embedderElement?.id !== "sidebar" && !dialog)) return;
    for (const sheet of SHEETS) view.windowUtils.loadSheetUsingURIString(sheet, view.windowUtils.AUTHOR_SHEET);
    // A private window's purple, like the window's own (styles/palettes.css).
    if (PrivateBrowsingUtils.isWindowPrivate(win)) page.documentElement.setAttribute("privatebrowsingmode", "temporary");
    follow(page, view);
  }, true);
}
