// timeout: 60
// The delete confirmation counts the workspace's tabs in every window, since they all move.
const wait = ms => new Promise(r => setTimeout(r, ms));
const system = Services.scriptSecurityManager.getSystemPrincipal();
const ready = w => new Promise(r => {
  const check = () => w.aetherWorkspaces ? r() : setTimeout(check, 100);
  check();
});
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "ws-a", name: "A" }]));
const other = OpenBrowserWindow();
await ready(other);
await wait(1000);
for (const w of [window, other]) {
  const tab = w.gBrowser.addTab("data:text/html,a", { triggeringPrincipal: system });
  await wait(300);
  w.aetherWorkspaces.moveTabs([tab], "ws-a");
}
// Answer the confirmation with "Cancel", noting what it said.
const real = Services.prompt;
let asked = null;
Object.defineProperty(Services, "prompt", { value: { confirm: (w, title, text) => (asked = text, false) }, configurable: true, writable: true });
try {
  aetherWorkspaces.remove("ws-a");
} finally {
  Object.defineProperty(Services, "prompt", { value: real, configurable: true, writable: true });
}
other.close();
return { ok: asked === `Delete "A"? Its 2 tabs will move to "Main".`, asked };
