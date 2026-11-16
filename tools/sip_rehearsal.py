"""Rehearses moving Sip 0.1's history to Sip 1.0 the way a real profile upgrades, across browser
restarts, on a throwaway profile (never yours):

  1. A profile with Sip 0.1 (sip@osama.local) installed for real: 40 days, a 50 GB budget renewing
     on the 7th, one allowed site, YouTube at 360p, private windows allowed, its button moved.
  2. Astrelle starts again with this checkout's interface and the new Sip in distribution/.
  3. Sip 1.0 has everything, the old add-on is gone, a backup holds the 40 days, and New Tab
     shows what Sip's summary says.

Then again with the move stopped after Sip got the history (failAfter=import) and after Sip
acknowledged it (failAfter=ack), each finished by a second start; and with the browser killed
partway (SIP_REHEARSAL_KILL_AT seconds after it's ready), then started twice: a crash while
Firefox installs Sip leaves it listed but not started until the next restart, Firefox's own
recovery. Every run must end the same, with nothing lost or counted twice.

    AETHER_BIN=~/.cache/astrelle-test/aether python3 tools/sip_rehearsal.py

AETHER_BIN must be an install with the new Sip in distribution/extensions (scripts/install_ui.sh).
"""
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dev  # noqa: E402

CHECKOUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD_XPI = os.path.join(CHECKOUT, "tests", "fixtures", "sip-0.1.xpi")


def launch(profile, prefs):
    port = dev.free_port()
    with open(os.path.join(profile, "user.js"), "w") as f:
        for name, value in {**prefs, "marionette.port": port}.items():
            f.write(f"user_pref({json.dumps(name)}, {json.dumps(value)});\n")
    env = dict(os.environ, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS="1", XDG_DATA_HOME=os.path.join(profile, "xdg"), ASTRELLE_UI=os.path.join(CHECKOUT, "ui"), **dev.ENGLISH)
    proc = subprocess.Popen([dev.find_browser(), "--headless", "--marionette", "--no-remote", "--profile", profile],
                            env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    m = dev.Marionette(port)
    m.call("WebDriver:NewSession", {"capabilities": {}})
    m.call("Marionette:SetContext", {"value": "chrome"})
    return proc, m


def quit(proc, m):
    try:
        m.call("Marionette:Quit", {"flags": ["eAttemptQuit"]})
    except Exception:
        pass
    try:
        proc.wait(30)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(10)


def js(m, script, timeout=60):
    value = m.js(script, timeout)
    if isinstance(value, str) and value.startswith("ERROR"):
        raise RuntimeError(value)
    return value


SEED = """
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const job = await AddonManager.getInstallForFile(new FileUtils.File(%(xpi)s));
const old = await new Promise(resolve => { job.addListener({ onInstallEnded: (_, a) => resolve(a) }); job.install(); });
await wait(2000);
const pad = n => String(n).padStart(2, "0");
const days = {};
for (let i = 0; i < 40; i++) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  days[`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`] = { total: 1234567 * (i + 1), sites: { "news.com": 1234567 * (i + 1) } };
}
await sip.sipSet({ days, notified: {}, settings: { saver: true, autoplay: true, trackers: true, images: false, fonts: false,
  youtube: 360, allow: ["shop.com"], budgetGB: 50, resetDay: 7, notify: true } }, [], sip.OLD_SIP_ID);
await ExtensionPermissions.add(sip.OLD_SIP_ID, { permissions: ["internal:privateBrowsingAllowed"], origins: [] }, WebExtensionPolicy.getByID(sip.OLD_SIP_ID).extension);
await old.reload();
await wait(2000);
CustomizableUI.addWidgetToArea(sip.OLD_SIP_WIDGET, CustomizableUI.AREA_NAVBAR, 1);
// The old Astrelle had no migration of its own: as if this profile never ran it.
Services.prefs.clearUserPref("aether.sip.migration");
return { days, placement: CustomizableUI.getPlacementOfWidget(sip.OLD_SIP_WIDGET) };
"""

CHECK = """
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const sip = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const atStart = Services.prefs.getStringPref("aether.sip.migration", "");
for (let i = 0; i < 120 && Services.prefs.getStringPref("aether.sip.migration", "") !== "done"; i++) await wait(500);
// Sip has to be running for its storage to be read.
for (let i = 0; i < 180 && !((await sip.sipGet(["schema"])).schema === 2); i++) await wait(250);
let manual = null;
if (Services.prefs.getStringPref("aether.sip.migration", "") === "" && Services.env.get("SIP_REHEARSAL_DEBUG")) {
  await sip.migrateSip();
  manual = [Services.prefs.getStringPref("aether.sip.migration", ""), Services.prefs.getStringPref("aether.sip.migration.lastError", "")];
}
const fresh = await AddonManager.getAddonByID(sip.SIP_ID);
const stored = await sip.sipGet(null);
const folder = PathUtils.join(PathUtils.profileDir, "sip-migration");
const backups = (await IOUtils.exists(folder)) ? (await IOUtils.getChildren(folder)).filter(p => p.endsWith(".json")) : [];
const oldAddon = await AddonManager.getAddonByID(sip.OLD_SIP_ID);
const backup = backups.length ? await IOUtils.readJSON(backups[0]) : null;
const tab = gBrowser.addTrustedTab("chrome://aether/content/newtab/newtab.html");
gBrowser.selectedTab = tab;
await wait(2500);
const hero = tab.linkedBrowser.contentDocument?.getElementById("data-hero")?.textContent;
return {
  state: Services.prefs.getStringPref("aether.sip.migration", ""), error: Services.prefs.getStringPref("aether.sip.migration.lastError", ""),
  newOn: !!fresh?.isActive, oldGone: !(await AddonManager.getAddonByID(sip.OLD_SIP_ID)),
  days: Object.fromEntries(Object.entries(stored).filter(([k]) => k.startsWith("day.")).map(([k, v]) => [k.slice(4), v.total])),
  period: stored["opt.period"], youtube: stored["opt.youtube"], sites: stored["opt.sites"], budget: stored["opt.budgetGB"],
  private: !!WebExtensionPolicy.getByID(sip.SIP_ID)?.privateBrowsingAllowed,
  placement: CustomizableUI.getPlacementOfWidget(sip.SIP_WIDGET), backupDays: backup ? Object.keys(backup.data.days || {}).length : 0,
  newtabHero: hero, summaryHero: stored.summary?.text?.hero, backups: backups.length,
  debug: { promise: Services.prefs.getBoolPref("aether.sip.privateFromOld", null), perms: (await ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs").ExtensionPermissions.get(sip.SIP_ID)).permissions,
    atStart, manual, policyActive: !!WebExtensionPolicy.getByID(sip.SIP_ID)?.active,
    uuid: JSON.parse(Services.prefs.getStringPref("extensions.webextensions.uuids", "{}"))[sip.SIP_ID],
    keys: Object.keys(stored).length, schema: stored.schema, oldInstalled: !!oldAddon, oldOn: !!oldAddon?.isActive, newInstalled: !!fresh,
    migratedPref: Services.prefs.getBoolPref("extensions.webextensions.ExtensionStorageIDB.migrated.sip@osama.local", false) },
};
"""


def rehearse(name, interrupt=None):
    profile = tempfile.mkdtemp(prefix="sip-rehearsal-", dir=os.path.expanduser("~/.cache"))
    base = {"aether.welcome.shown": True, "extensions.installDistroAddons": False, "browser.shell.checkDefaultBrowser": False}
    try:
        proc, m = launch(profile, base)
        seeded = js(m, SEED % {"xpi": json.dumps(OLD_XPI)})
        time.sleep(1)
        quit(proc, m)
        if interrupt in ("import", "ack"):
            proc, m = launch(profile, {**base, "aether.sip.migration.failAfter": interrupt})
            time.sleep(12)
            quit(proc, m)
            with open(os.path.join(profile, "user.js")) as f:   # the next start runs without the hook
                kept = [line for line in f if "failAfter" not in line]
            with open(os.path.join(profile, "user.js"), "w") as f:
                f.writelines(kept)
            prefs = os.path.join(profile, "prefs.js")
            with open(prefs) as f:
                lines = [line for line in f if "failAfter" not in line]
            with open(prefs, "w") as f:
                f.writelines(lines)
        elif interrupt == "kill":
            proc, m = launch(profile, base)
            time.sleep(float(os.environ.get("SIP_REHEARSAL_KILL_AT", "1.5")))
            os.kill(proc.pid, signal.SIGKILL)   # our own browser, by its PID
            proc.wait(10)
            # A crash while Firefox installs Sip, in the first second or two, leaves it listed as on but
            # not started until the next restart (Firefox's own recovery). Nothing is lost.
            if os.environ.get("SIP_REHEARSAL_RESTART_TWICE", "1") == "1":
                proc, m = launch(profile, base)
                time.sleep(20)
                quit(proc, m)
        proc, m = launch(profile, base)
        result = js(m, CHECK, timeout=150)
        quit(proc, m)
    finally:
        if os.environ.get("SIP_REHEARSAL_KEEP"):
            print("profile kept:", profile)
        else:
            shutil.rmtree(profile, ignore_errors=True)
    want_days = {k: v["total"] for k, v in seeded["days"].items()}
    checks = {
        "done": result["state"] == "done",
        "the new Sip is on, the old one gone": result["newOn"] and result["oldGone"],
        "every day's total, to the byte": all(result["days"].get(k) == v for k, v in want_days.items()),
        "renews on the 7th, 360p, 50 GB": result["period"] == {"kind": "monthly", "day": 7} and result["youtube"] == 360 and result["budget"] == 50,
        "the allowed site has every saver off": result["sites"] == {"shop.com": {"autoplay": False, "trackers": False, "images": False, "fonts": False}},
        "private windows still allowed": result["private"],
        "the button where it was": result["placement"] == seeded["placement"],
        "a backup with the 40 days": result["backupDays"] == 40,
        "New Tab says what Sip says": bool(result["newtabHero"]) and result["newtabHero"] == result["summaryHero"],
    }
    failed = [k for k, ok in checks.items() if not ok]
    print(f"{'pass' if not failed else 'FAIL'}  {name}" + (f"  {failed} state={result['state']!r} error={result.get('error')!r} {result['debug']}" if failed else ""))
    return not failed


if __name__ == "__main__":
    only = sys.argv[1:]
    plan = [("upgrade", None), ("stopped after the import, then finished", "import"),
            ("stopped after the ack, then finished", "ack"), ("killed partway, then started again", "kill")]
    results = [rehearse(name, how) for name, how in plan if not only or (how or "upgrade") in only]
    print(f"\n{sum(results)} of {len(results)} rehearsals passed")
    sys.exit(0 if all(results) else 1)
