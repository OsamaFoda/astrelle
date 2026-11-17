// Tells you when there's a newer Astrelle: once a day it asks GitHub for the newest release and,
// when that's newer than this one, a bar above the page says so. Installed with install.sh, its
// Update runs that installer's copy in Astrelle's folder, which swaps the new build in while
// you browse (as a distribution's updates do) and then asks for a restart. Installed some other
// way, Download opens the Releases page. Not now: not again for that release. Not in the Flatpak,
// which Flathub updates. Builds name their release in astrelle-release, in their folder; one
// without (a build of your own) doesn't check. aether.updates.check false turns it off.

import { inFlatpak } from "./app-icon.mjs";
import { restart } from "./languages.mjs";
import { tr } from "./l10n.mjs";

const { Subprocess } = ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs");

const CHECK = "aether.updates.check";
const LAST = "aether.updates.lastCheck"; // seconds
const DECLINED = "aether.updates.declined"; // the release said Not now to
const DAY = 24 * 60 * 60;
// Overridable, for the tests.
const latestURL = () => Services.prefs.getStringPref("aether.updates.url", "https://api.github.com/repos/OsamaFoda/astrelle/releases/latest");
const pageURL = () => Services.prefs.getStringPref("aether.updates.page", "https://github.com/OsamaFoda/astrelle/releases/latest");

const inFolder = name => PathUtils.join(Services.dirsvc.get("GreD", Ci.nsIFile).path, name);

async function current() {
  const pref = Services.prefs.getStringPref("aether.updates.current", "");
  if (pref) return pref;
  try {
    return (await IOUtils.readUTF8(inFolder("astrelle-release"))).trim();
  } catch {
    return "";
  }
}

async function installer() {
  const path = Services.prefs.getStringPref("aether.updates.installer", "") || inFolder("install.sh");
  return (await IOUtils.exists(path)) ? path : "";
}

// "v153.8.0esr-2" is newer than "v153.7.0esr-3": Firefox's version, then the build of it.
function parts(tag) {
  const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?esr-(\d+)$/.exec(tag);
  return match && [match[1], match[2], match[3] ?? 0, match[4]].map(Number);
}

export function isNewer(latest, mine) {
  const a = parts(latest), b = parts(mine);
  if (!a || !b) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

const clear = box => ["aether-update", "aether-update-working"].forEach(value => box.getNotificationWithValue(value)?.close());

async function update(box) {
  clear(box);
  box.appendNotification("aether-update-working", { label: tr("astrelle-update-updating"), priority: box.PRIORITY_INFO_MEDIUM }, []);
  let ok = false;
  try {
    const bash = await Subprocess.pathSearch("bash");
    const done = await Subprocess.call({ command: bash, arguments: [await installer(), "--while-open"], stderr: "stdout" });
    const output = await done.stdout.readString();
    ok = (await done.wait()).exitCode === 0;
    if (!ok) console.error("Astrelle: update", output);
  } catch (e) {
    console.error("Astrelle: update", e);
  }
  clear(box);
  if (ok) {
    box.appendNotification("aether-update-restart", { label: tr("astrelle-update-restart-to"), priority: box.PRIORITY_INFO_MEDIUM },
      [{ label: tr("astrelle-language-restart"), callback: restart }]);
  } else {
    box.appendNotification("aether-update-failed", { label: tr("astrelle-update-failed"), priority: box.PRIORITY_WARNING_LOW }, []);
  }
}

// Asks, and offers the newer release if there is one. True when it did.
export async function check(win) {
  const mine = await current();
  if (!mine) return false;
  Services.prefs.setIntPref(LAST, Math.floor(Date.now() / 1000));
  const response = await fetch(latestURL(), { credentials: "omit", cache: "no-store" });
  if (!response.ok) return false;
  const latest = (await response.json()).tag_name ?? "";
  if (!isNewer(latest, mine) || Services.prefs.getStringPref(DECLINED, "") === latest || win.closed) return false;
  const box = win.gBrowser.getNotificationBox();
  if (box.getNotificationWithValue("aether-update")) return true;
  const own = await installer();
  await box.appendNotification("aether-update", { label: tr("astrelle-update-ready"), priority: box.PRIORITY_INFO_MEDIUM }, [
    own
      ? { label: tr("astrelle-update-now"), callback: () => void update(box) }
      : { label: tr("astrelle-update-download"), callback: () => win.openTrustedLinkIn(pageURL(), "tab") },
    { label: tr("astrelle-language-not-now"), callback: () => Services.prefs.setStringPref(DECLINED, latest) },
  ]);
  return true;
}

let started = false;
export function init(win) {
  if (started || inFlatpak()) return;
  started = true;
  // A while after start-up, so it never slows it; then once a day, whenever that comes round.
  const due = () => Services.prefs.getBoolPref(CHECK, true) && Date.now() / 1000 - Services.prefs.getIntPref(LAST, 0) >= DAY;
  const maybe = () => {
    if (!due()) return;
    const target = Services.wm.getMostRecentWindow("navigator:browser");
    if (target) check(target).catch(e => console.warn("Astrelle: update check", e));
  };
  setTimeout(maybe, Services.prefs.getIntPref("aether.updates.delay", 15000));
  setInterval(maybe, 60 * 60 * 1000);
}
