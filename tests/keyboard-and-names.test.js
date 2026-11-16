// The keyboard reaches every toolbar button in the sidebar layout as with tabs on top (Firefox's
// walk skipped the display: contents box the sidebar puts them in), workspaces included; and
// Astrelle's icon-only buttons have names a screen reader can say, with the workspace you're in
// marked as pressed.
const wait = ms => new Promise(r => setTimeout(r, ms));
const svc = Cc["@mozilla.org/accessibilityService;1"].getService(Ci.nsIAccessibilityService);
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "b", name: "Study" }]));
await wait(1500);
const order = () => {
  const root = document.getElementById("nav-bar");
  const walker = ToolbarKeyboardNavigator._getWalker(root);
  walker.currentNode = root;
  const ids = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.localName !== "toolbartabstop") ids.push(n.id || n.textContent.trim());
  return ids;
};
const sidebar = order();
const want = ["back-button", "reload-button", "Main", "Study", "+", "unified-extensions-button", "aether-compact-mode"];
const reachable = want.every(id => sidebar.includes(id));
const pressed = acc => { const state = {}; acc.getState(state, {}); return Boolean(state.value & Ci.nsIAccessibleStates.STATE_PRESSED); };
const buttons = [...document.querySelectorAll(".aether-ws")].map(b => svc.getAccessibleFor(b));
const names = buttons.map(a => `${a.name}${pressed(a) ? " (pressed)" : ""}`);
window.aetherPeek.open("about:blank");
await wait(800);
const close = svc.getAccessibleFor(document.querySelectorAll(".aether-peek-button")[1])?.name;
window.aetherPeek.close();
return {
  ok: reachable && names.join("|") === "Main (pressed)|Study|New workspace" && /^Close/.test(close ?? ""),
  sidebar, names, close,
};
