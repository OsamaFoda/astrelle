// Puts the address bar and navigation buttons in the top slot of the sidebar while tabs are
// vertical and the sidebar is expanded, like Zen and Arc. With top tabs, or with the sidebar
// collapsed to icons (too narrow to read an address), they stay in the top toolbar.
// The moving itself is CSS (styles/aether.css, :root[aether-urlbar-in-sidebar]), so Firefox's
// toolbar and address bar code never sees its elements move. This script only decides when,
// and tells the CSS how wide the sidebar is and how tall the toolbar is: in the sidebar, as tall
// as its top rows (the sidebar's tabs start under them), and its bottom row of tools (they end
// above it).

const VERTICAL_TABS = "sidebar.verticalTabs";

export function init(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const container = doc.getElementById("sidebar-container");
  const toolbox = doc.getElementById("navigator-toolbox");
  if (!container || !toolbox) return;

  const update = () => {
    const inSidebar =
      Services.prefs.getBoolPref(VERTICAL_TABS, false) &&
      container.hasAttribute("sidebar-launcher-expanded") &&
      !container.hidden;
    root.toggleAttribute("aether-urlbar-in-sidebar", inSidebar);
    win.requestAnimationFrame(measure);
  };

  // In the sidebar, the toolbar's rows (styles/aether.css gives each part of it its grid row):
  // 1 to 3 at the top, 5 at the bottom.
  const measure = () => {
    const box = toolbox.getBoundingClientRect();
    let top = box.height, bottom = 0;
    if (root.hasAttribute("aether-urlbar-in-sidebar") && box.height) {
      const parts = [...doc.querySelectorAll("#nav-bar > *, #nav-bar-customization-target > *")]
        .filter(el => el.checkVisibility())
        .map(el => [win.getComputedStyle(el).gridRowStart, el.getBoundingClientRect()]);
      const ends = parts.filter(([row]) => ["1", "2", "3"].includes(row)).map(([, r]) => r.bottom);
      const starts = parts.filter(([row]) => row === "5").map(([, r]) => r.top);
      if (ends.length) top = Math.max(...ends) - box.top + 4;
      if (starts.length) bottom = box.bottom - Math.min(...starts) + 4;
    }
    root.style.setProperty("--aether-toolbox-height", `${top}px`);
    root.style.setProperty("--aether-toolbox-bottom", `${bottom}px`);
  };

  const sizes = new win.ResizeObserver(() => {
    // Not in full screen, where it collapses. In compact mode too: a window that opens in it (any
    // new one, every one after a restart) has Firefox's width for it, carried over from the
    // others, and the page has to slide aside by that.
    const width = container.getBoundingClientRect().width;
    const inPlace = !root.hasAttribute("inFullscreen") && !root.hasAttribute("inDOMFullscreen");
    if (inPlace && width >= 120) root.style.setProperty("--aether-sidebar-width", `${width}px`);
    measure();
  });
  sizes.observe(container);
  sizes.observe(toolbox);
  for (const id of ["urlbar-container", "aether-workspaces", "nav-bar"]) {
    const el = doc.getElementById(id);
    if (el) sizes.observe(el);
  }

  new win.MutationObserver(update).observe(container, {
    attributes: true,
    attributeFilter: ["sidebar-launcher-expanded", "hidden"],
  });
  Services.prefs.addObserver(VERTICAL_TABS, update);
  win.addEventListener("unload", () => Services.prefs.removeObserver(VERTICAL_TABS, update), { once: true });
  update();
}
