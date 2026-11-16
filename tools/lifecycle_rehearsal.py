"""Rehearses starting and quitting Astrelle on a throwaway profile (never yours), across real
restarts of this checkout's interface:

  first-run  a new profile opens the welcome once, and never again
  restart    Settings' "Restart Astrelle": every window, tab, workspace, pinned tab, tab group,
             compact mode and colour theme comes back as it was
  crash      the browser killed outright: crash recovery brings the same back
  quit       a normal quit and start: Astrelle continues where you left off by default

    python3 tools/lifecycle_rehearsal.py [scenario ...]
"""
import json
import os
import shutil
import signal
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dev  # noqa: E402
from sip_rehearsal import launch, quit, js  # noqa: E402

# Marionette's own defaults turn session restore off; a person's browser has it on.
PREFS = {"remote.prefs.recommended": False, "browser.shell.checkDefaultBrowser": False,
         "browser.sessionstore.resume_from_crash": True, "datareporting.policy.dataSubmissionEnabled": False}

WAIT_READY = """
const wait = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 100 && !window.aetherWorkspaces; i++) await wait(100);
await wait(2500);
return true;
"""

SETUP = """
const wait = ms => new Promise(r => setTimeout(r, ms));
const W = window.aetherWorkspaces;
Services.prefs.setStringPref("aether.palette", "ocean");
Services.prefs.setStringPref("aether.workspaces", JSON.stringify([{ id: "home", name: "Main" }, { id: "b", name: "Study" }]));
await wait(300);
const open = url => gBrowser.addTrustedTab(url);
const pinned = open("about:logo");
gBrowser.pinTab(pinned);
open("about:robots");
const grouped = open("about:buildconfig");
await wait(300);
gBrowser.addTabGroup([grouped], { label: "Reading", insertBefore: grouped });
W.switchTo("b");
await wait(300);
open("about:mozilla");
gBrowser.selectedTab = open("about:license");
Services.prefs.setBoolPref("aether.compactMode", true);
await wait(3000); // the session is saved every few seconds
return true;
"""

SNAPSHOT = """
const W = window.aetherWorkspaces;
const url = tab => JSON.parse(SessionStore.getTabState(tab)).entries?.at(-1)?.url ?? tab.linkedBrowser.currentURI.spec;
const windows = [...Services.wm.getEnumerator("navigator:browser")];
return {
  windows: windows.length,
  tabs: gBrowser.tabs.map(t => [url(t), t.pinned ? "pinned" : W.workspaceOf(t), t.hidden, t.group?.label ?? ""].join(" | ")),
  active: W.active(),
  groups: (gBrowser.tabGroups ?? []).map(g => `${g.label}:${g.hidden ? "hidden" : "shown"}`),
  compact: document.documentElement.hasAttribute("aether-compact"),
  palette: Services.prefs.getStringPref("aether.palette", ""),
  selected: url(gBrowser.selectedTab),
  welcomeShown: Services.prefs.getBoolPref("aether.welcome.shown", false),
};
"""


def start(profile, extra=None):
    proc, m = launch(profile, {**PREFS, **(extra or {})})
    js(m, WAIT_READY)
    return proc, m


def connect(port):
    """After an in-place restart (the same process, on Linux), talks to its new Marionette."""
    for _ in range(60):
        try:
            m = dev.Marionette(port)
            m.call("WebDriver:NewSession", {"capabilities": {}})
            m.call("Marionette:SetContext", {"value": "chrome"})
            return m
        except Exception:  # noqa: BLE001
            time.sleep(1)
    return None


def port_of(profile):
    for line in open(os.path.join(profile, "user.js")):
        if '"marionette.port"' in line:
            return int(line.split(",")[1].strip(" );\n"))


def same(before, after):
    keys = ["tabs", "active", "groups", "compact", "palette", "selected"]
    return {k: (before[k], after[k]) for k in keys if before[k] != after[k]}


def scenario_first_run(profile):
    proc, m = start(profile)
    first = js(m, "return gBrowser.tabs.map(t => t.linkedBrowser.currentURI.spec);")
    quit(proc, m)
    proc, m = start(profile)
    second = js(m, "return gBrowser.tabs.map(t => t.linkedBrowser.currentURI.spec);")
    quit(proc, m)
    welcome = lambda tabs: sum("welcome" in url for url in tabs)
    return welcome(first) == 1 and welcome(second) == 0, {"first": first, "second": second}


def scenario_restart(profile):
    proc, m = start(profile)
    js(m, SETUP)
    before = js(m, SNAPSHOT)
    port = port_of(profile)
    try:
        js(m, 'ChromeUtils.importESModule("chrome://aether/content/scripts/languages.mjs").restart(); return true;', 10)
    except Exception:
        pass  # the connection drops as it restarts
    time.sleep(5)
    m = connect(port)
    if not m:
        proc.kill()
        return False, {"error": "didn't come back"}
    js(m, WAIT_READY)
    after = js(m, SNAPSHOT)
    quit(proc, m)
    diff = same(before, after)
    return not diff and after["windows"] == 1, {"before": before, "differences": diff}


def scenario_crash(profile):
    proc, m = start(profile)
    js(m, SETUP)
    before = js(m, SNAPSHOT)
    time.sleep(35)  # Firefox writes the session every 15 seconds or so (when idle); a crash loses what came after
    proc.send_signal(signal.SIGKILL)
    proc.wait(10)
    proc, m = start(profile)
    after = js(m, SNAPSHOT)
    quit(proc, m)
    diff = same(before, after)
    return not diff, {"before": before, "differences": diff}


def scenario_quit(profile):
    proc, m = start(profile)
    js(m, SETUP)
    before = js(m, SNAPSHOT)
    quit(proc, m)
    proc, m = start(profile)
    after = js(m, SNAPSHOT)
    quit(proc, m)
    diff = same(before, after)
    return not diff, {"before": before, "differences": diff}


SCENARIOS = {"first-run": scenario_first_run, "restart": scenario_restart, "crash": scenario_crash, "quit": scenario_quit}


def main():
    names = sys.argv[1:] or list(SCENARIOS)
    failed = 0
    for name in names:
        profile = tempfile.mkdtemp(prefix="astrelle-lifecycle-")
        try:
            ok, detail = SCENARIOS[name](profile)
        except Exception as error:  # noqa: BLE001
            ok, detail = False, {"error": str(error)}
        finally:
            shutil.rmtree(profile, ignore_errors=True)
        failed += not ok
        print(f"{'pass' if ok else 'FAIL'}  {name}")
        if not ok:
            print(json.dumps(detail, indent=2))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
