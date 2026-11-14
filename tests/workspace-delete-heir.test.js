// timeout: 60
// Deleting a workspace moves its tabs to the workspace the confirmation names, in every window
// (private ones too), even where another workspace is showing, and a tab of it restored later (a
// reopened window, the last session) goes there as well.
const wait = ms => new Promise(r => setTimeout(r, ms));
const system = Services.scriptSecurityManager.getSystemPrincipal();
const page = title => `data:text/html,<title>${title}</title>${title}`;
const { SessionStore } = ChromeUtils.importESModule("resource:///modules/sessionstore/SessionStore.sys.mjs");
const ready = w => new Promise(r => {
  const check = () => w.aetherWorkspaces ? r() : setTimeout(check, 100);
  check();
});
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([
  { id: "home", name: "Main" }, { id: "ws-gone", name: "Gone" }, { id: "ws-study", name: "Study" },
]));
await wait(1000);
// In each window, a tab in "Gone" and the window showing "Study"; this one shows "Gone".
const setUp = async (w, show) => {
  const tab = w.gBrowser.addTab(page("gone"), { triggeringPrincipal: system });
  await wait(500);
  w.aetherWorkspaces.moveTabs([tab], "ws-gone");
  w.aetherWorkspaces.switchTo(show);
  await wait(300);
  return tab;
};
const other = OpenBrowserWindow();
const priv = OpenBrowserWindow({ private: true });
await ready(other);
await ready(priv);
await wait(1000);
const here = await setUp(window, "ws-gone");
const there = await setUp(other, "ws-study");
const hidden = await setUp(priv, "ws-study");
aetherWorkspaces.deleteWorkspace("ws-gone");
await wait(300);
const restored = other.gBrowser.addTab("about:blank", { triggeringPrincipal: system });
await wait(300);
SessionStore.setTabState(restored, JSON.stringify({
  entries: [{ url: page("restored"), triggeringPrincipal_base64: E10SUtils.SERIALIZED_SYSTEMPRINCIPAL }],
  extData: { aetherWorkspace: "ws-gone" },
}));
await wait(1500);
const ws = tab => SessionStore.getCustomTabValue(tab, "aetherWorkspace");
const result = {
  here: ws(here), there: ws(there), private: ws(hidden), restored: ws(restored),
  otherShows: other.aetherWorkspaces.active(), privateShows: priv.aetherWorkspaces.active(),
};
other.close();
priv.close();
return { ok: [result.here, result.there, result.private, result.restored].every(id => id === "home")
  && result.otherShows === "ws-study" && result.privateShows === "ws-study", ...result };
