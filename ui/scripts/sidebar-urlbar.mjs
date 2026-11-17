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

  // In the sidebar: its top rows (the buttons and the address bar), which the tabs start under;
  // its tools (laid out under the address bar), moved down by --aether-tools-drop to end at the
  // sidebar's foot, which the sidebar ends above; and workspaces (laid out under the tools),
  // moved down by --aether-ws-drop to end just above the line over the sidebar's own tools, which
  // the tabs end above (--aether-ws-height). The clip takes in those three bands.
  const TOOLS = "#unified-extensions-button, #nav-bar-customization-target > [id$='-browser-action'], " +
    "#aether-split-view, #aether-compact-mode, #reset-pbm-toolbar-button, #PanelUI-button";
  const GAP = 4;
  // Where a set of the toolbar's parts is laid out, less how far it's moved now: [top, bottom].
  const laidOut = (selector, moved) => {
    const rects = [...doc.querySelectorAll(selector)].filter(el => el.checkVisibility()).map(el => el.getBoundingClientRect());
    return rects.length ? [Math.min(...rects.map(r => r.top)) - moved, Math.max(...rects.map(r => r.bottom)) - moved] : null;
  };
  const px = name => parseFloat(root.style.getPropertyValue(name)) || 0;
  const measure = () => {
    const box = toolbox.getBoundingClientRect();
    const vars = { "--aether-toolbox-height": box.height, "--aether-toolbox-bottom": 0, "--aether-tools-drop": 0,
      "--aether-ws-drop": 0, "--aether-ws-height": 0, "--aether-ws-top": 0, "--aether-ws-bottom": 0 };
    if (root.hasAttribute("aether-urlbar-in-sidebar") && box.height) {
      vars["--aether-toolbox-height"] = doc.getElementById("urlbar-container").getBoundingClientRect().bottom - box.top + GAP;
      const tools = laidOut(TOOLS, px("--aether-tools-drop"));
      let floor = box.bottom - 6; // where the next band up has to end
      if (tools) {
        vars["--aether-tools-drop"] = Math.max(0, floor - tools[1]);
        vars["--aether-toolbox-bottom"] = box.bottom - (tools[0] + vars["--aether-tools-drop"]) + GAP;
      }
      const ws = laidOut("#aether-workspaces", px("--aether-ws-drop"));
      if (ws) {
        // Above the line over the sidebar's own tools (or, without them, above the toolbar's).
        const line = doc.querySelector("sidebar-main")?.shadowRoot?.querySelector("#sidebar-tools-and-extensions-splitter");
        const lineTop = line?.checkVisibility() ? line.getBoundingClientRect().top : box.bottom - vars["--aether-toolbox-bottom"];
        floor = lineTop - GAP;
        vars["--aether-ws-drop"] = Math.max(0, floor - ws[1]);
        const top = ws[0] + vars["--aether-ws-drop"];
        vars["--aether-ws-height"] = ws[1] - ws[0] + 2 * GAP;
        vars["--aether-ws-top"] = top - GAP - box.top;
        vars["--aether-ws-bottom"] = floor + GAP - box.top;
      }
    }
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, `${value}px`);
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
