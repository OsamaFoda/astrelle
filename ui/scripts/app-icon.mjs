// Astrelle's app icon: Eclipse (the default), Aurora, Comet or Galaxy, each in its Original
// colours, Nightfall's (black, grey and white) or Sunrise's (warmer): "aurora", "aurora-sunrise" and so on (the drawings are in ui/icons/), chosen in
// the welcome or in Customize Astrelle and kept in the aether.appIcon pref. The desktop takes the
// icon from Astrelle's launcher (aether.desktop in ~/.local/share/applications), so this keeps a copy
// of the chosen icon beside it and points the launcher at the copy; the dock follows in a moment.
// Builds carry Eclipse as the window and About icon. In the Flatpak, the icon is the one its package
// gives the desktop, which nothing inside can change: Eclipse, with no choice offered.

const { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");

export const SHAPES = ["eclipse", "aurora", "comet", "galaxy"];
export const COLOURWAYS = ["original", "nightfall", "sunrise"];
export const ICONS = SHAPES.flatMap(shape => COLOURWAYS.map(colours => nameOf(shape, colours)));

// "aurora" in its Original colours, "aurora-sunrise" in Sunrise's.
export function nameOf(shape, colours) {
  return colours === "original" ? shape : `${shape}-${colours}`;
}
const PREF = "aether.appIcon";

export function inFlatpak() {
  return !!Services.env.get("FLATPAK_ID");
}

export function chosen() {
  if (inFlatpak()) return "eclipse";
  let name = Services.prefs.getStringPref(PREF, "eclipse");
  if (name === "nightfall" || name === "sunrise") name = `eclipse-${name}`; // briefly icons of their own
  return ICONS.includes(name) ? name : "eclipse";
}

export function iconURL(name = chosen()) {
  return `chrome://aether/content/icons/${name}.svg`;
}

function dataHome() {
  return Services.env.get("XDG_DATA_HOME") ||
    PathUtils.join(Services.dirsvc.get("Home", Ci.nsIFile).path, ".local", "share");
}

async function updateLauncher() {
  const launcher = PathUtils.join(dataHome(), "applications", "aether.desktop");
  if (!(await IOUtils.exists(launcher))) return;
  const name = chosen();
  const source = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry)
    .convertChromeURL(Services.io.newURI(iconURL(name))).QueryInterface(Ci.nsIFileURL).file.path;
  const copy = PathUtils.join(dataHome(), "aether", "icons", `${name}.svg`);
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
  const update = () => updateLauncher().catch(e => console.error("Astrelle: app icon", e));
  Services.prefs.addObserver(PREF, update);
  update();
}
