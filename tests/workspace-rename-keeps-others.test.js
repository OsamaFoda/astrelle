// timeout: 60
// Renaming a workspace keeps what another window changed while the name was being typed: a
// workspace deleted there stays deleted, and one created there stays.
const wait = ms => new Promise(r => setTimeout(r, ms));
const ready = w => new Promise(r => {
  const check = () => w.aetherWorkspaces ? r() : setTimeout(check, 100);
  check();
});
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([
  { id: "home", name: "Main" }, { id: "ws-a", name: "A" }, { id: "ws-b", name: "B" },
]));
const other = OpenBrowserWindow();
await ready(other);
await wait(1000);
// While this window asks for the new name, the other one deletes B and creates C.
const real = Services.prompt;
const stub = {
  prompt(w, title, text, name) {
    other.aetherWorkspaces.deleteWorkspace("ws-b");
    Services.prefs.setStringPref("aether.workspaces", JSON.stringify([
      ...JSON.parse(Services.prefs.getStringPref("aether.workspaces")), { id: "ws-c", name: "C" },
    ]));
    name.value = "Renamed";
    return true;
  },
};
Object.defineProperty(Services, "prompt", { value: stub, configurable: true, writable: true });
try {
  aetherWorkspaces.rename("ws-a");
} finally {
  Object.defineProperty(Services, "prompt", { value: real, configurable: true, writable: true });
}
const list = JSON.parse(Services.prefs.getStringPref("aether.workspaces")).map(w => w.name);
other.close();
return { ok: list.join() === "Main,Renamed,C", list };
