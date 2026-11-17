// Astrelle's icon: the Aurora Sunrise scene with a frosted-glass "a" in front of it (icons/astrelle.svg,
// drawn by branding-src/icon.py), the same everywhere: the window and About (builds carry it, from
// branding/), the pages, the launcher, the Flatpak. The desktop takes the icon from Astrelle's
// launcher (aether.desktop in ~/.local/share/applications), so this keeps a copy of the icon beside
// it and points the launcher at the copy: a launcher that showed an icon chosen before (there were
// several, once) shows this one. In the Flatpak, the icon is its package's (from branding/ too).

const { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");

export const ICON_URL = "chrome://aether/content/icons/astrelle.svg";

export function iconURL() {
  return ICON_URL;
}

export function inFlatpak() {
  return !!Services.env.get("FLATPAK_ID");
}

function dataHome() {
  return Services.env.get("XDG_DATA_HOME") ||
    PathUtils.join(Services.dirsvc.get("Home", Ci.nsIFile).path, ".local", "share");
}

async function updateLauncher() {
  const launcher = PathUtils.join(dataHome(), "applications", "aether.desktop");
  if (!(await IOUtils.exists(launcher))) return;
  const source = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry)
    .convertChromeURL(Services.io.newURI(ICON_URL)).QueryInterface(Ci.nsIFileURL).file.path;
  const copy = PathUtils.join(dataHome(), "aether", "icons", "astrelle.svg");
  await IOUtils.makeDirectory(PathUtils.parent(copy));
  await IOUtils.copy(source, copy);
  const text = await IOUtils.readUTF8(launcher);
  const updated = text.replace(/^Icon=.*$/m, `Icon=${copy}`);
  if (updated !== text) await IOUtils.writeUTF8(launcher, updated);
}

let started = false;

// Once per run, not per window.
export function init() {
  if (started || AppConstants.platform !== "linux") return;
  started = true;
  Services.prefs.clearUserPref("aether.appIcon"); // the icon once chosen, of several
  updateLauncher().catch(e => console.error("Astrelle: app icon", e));
}
