// Sip inside Astrelle: the bundled add-on kept installed and up to date, the history moved over
// from the old add-on id, the browser's own autoplay and preloading following Sip's autoplay
// saver, and the one way Astrelle opens Sip's storage (sipDb).
//
// Astrelle talks to Sip only through Sip's storage.local: it reads `summary` and a few `opt.*`
// settings, writes the settings its own welcome and Settings offer, and hands Sip commands
// (`cmd.import`, `cmd.carrier`) that Sip acknowledges in `ack`.

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
const { ExtensionStorageIDB } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorageIDB.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
const { setTimeout, clearTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");

export const SIP_ID = "sip@osamafoda.github.io";
export const OLD_SIP_ID = "sip@osama.local";
const widgetOf = id => `${id.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}-browser-action`;
export const SIP_WIDGET = widgetOf(SIP_ID);
export const OLD_SIP_WIDGET = widgetOf(OLD_SIP_ID);

const MIGRATION = "aether.sip.migration";          // "", "pending:<id>" or "done"
const OLD_PLACEMENT = "aether.sip.oldPlacement";   // the old button's place, kept for the new one
const FAIL_AFTER = "aether.sip.migration.failAfter"; // tests: stop at a step, as a crash would
const LAST_ERROR = "aether.sip.migration.lastError"; // why the last try stopped, if it did
const PRIVATE_PROMISE = "aether.sip.privateFromOld";  // the old Sip had private windows: so will the new
const GRANTED = "aether.sip.autoplayGranted";      // the autoplay permissions Astrelle gave
const STORAGE_USER_CONTEXT = 4294967295;           // where Firefox keeps storage.local (ExtensionStorageIDB)
const KEEP_DAYS = 62;

// What Sip means by a missing key (Sip's lib/settings.js; tests/sip-defaults.test.js keeps them equal).
export const SIP_DEFAULTS = Object.freeze({
  saver: true,
  autoplay: true,
  sites: Object.freeze({}),
  youtube: 480,
  budgetGB: 0,
  period: Object.freeze({ kind: "monthly", day: 1 }),
});
export const YOUTUBE_CHOICES = [240, 360, 480, 720, 1080, 0];

// ----- Storage ---------------------------------------------------------------------------------

// Sip's storage.local, opened as Firefox does for the add-on itself: its address (from the uuid
// pref) in the reserved user context; a plain principal would open a different, empty database.
// Firefox opens it only while the add-on is on (ExtensionStorageIDB refuses otherwise), so for an
// add-on that's off this is null, reads are empty and writes wait for it to be turned on.
export async function sipDb(id = SIP_ID) {
  if (!WebExtensionPolicy.getByID(id)?.active) return null;
  let uuids = {};
  try {
    uuids = JSON.parse(Services.prefs.getStringPref("extensions.webextensions.uuids", "{}"));
  } catch {}
  if (!uuids[id]) return null;
  const principal = Services.scriptSecurityManager.createContentPrincipal(
    Services.io.newURI(`moz-extension://${uuids[id]}/`), { userContextId: STORAGE_USER_CONTEXT });
  // An open that races the add-on creating its storage can wait forever; better to fail and retry.
  return withTimeout(ExtensionStorageIDB.open(principal), 15000, `${id}'s storage didn't open`);
}

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })])
    .finally(() => clearTimeout(timer));
}

// Until Sip's background has made its storage (it writes `schema` and `summary` as it starts),
// Astrelle stays out of it: opening it meanwhile can hang. Waits for that first write, at most
// `ms`, after Sip was just installed or turned on.
export function sipStarted(ms = 15000, id = SIP_ID) {
  return new Promise(resolve => {
    const timer = setTimeout(() => { stop(); resolve(false); }, ms);
    const stop = followSip(changes => {
      if (!("summary" in changes || "schema" in changes)) return;
      clearTimeout(timer);
      stop();
      resolve(true);
    }, id);
  });
}

export async function sipGet(keys = null, id = SIP_ID) {
  const db = await sipDb(id);
  return db ? db.get(keys) : {};
}

// Writes and removes keys, then tells Sip (and Astrelle's own listeners) what changed.
export async function sipSet(items = {}, remove = [], id = SIP_ID) {
  const db = await sipDb(id);
  if (!db) return false;
  const changes = {};
  if (Object.keys(items).length) Object.assign(changes, await db.set(items));
  if (remove.length) Object.assign(changes, await db.remove(remove));
  if (Object.keys(changes).length) ExtensionStorageIDB.notifyListeners(id, changes);
  return true;
}

// Calls back with the changed keys whenever Sip's storage changes; returns what stops it.
export function followSip(callback, id = SIP_ID) {
  const listener = changes => callback(changes);
  ExtensionStorageIDB.addOnChangedListener(id, listener);
  return () => ExtensionStorageIDB.removeOnChangedListener(id, listener);
}

// Waits until test(stored) holds for Sip's storage, or the time is up. True if it held.
async function waitFor(test, ms, id = SIP_ID) {
  if (test(await sipGet(null, id))) return true;
  return new Promise(resolve => {
    let stop = null;
    const timer = setTimeout(() => { stop?.(); resolve(false); }, ms);
    stop = followSip(async () => {
      if (!test(await sipGet(null, id))) return;
      clearTimeout(timer);
      stop();
      resolve(true);
    }, id);
  });
}

// ----- The bundled add-on ----------------------------------------------------------------------

// The Sip that ships in Astrelle: in the install's distribution folder, else in the interface
// folder (a linked checkout, or ASTRELLE_UI in tests).
function bundledFile() {
  const candidates = [];
  try {
    const dist = Services.dirsvc.get("XREAppDist", Ci.nsIFile);
    dist.append("extensions");
    dist.append(`${SIP_ID}.xpi`);
    candidates.push(dist);
  } catch {}
  const ui = Services.env.get("ASTRELLE_UI");
  try {
    const linked = ui ? new FileUtils.File(ui) : Services.dirsvc.get("GreD", Ci.nsIFile);
    if (!ui) linked.append("aether-ui");
    linked.append("extensions");
    linked.append(`${SIP_ID}.xpi`);
    candidates.push(linked);
  } catch {}
  return candidates.find(file => file.exists()) ?? null;
}

function installAndWait(install) {
  return new Promise((resolve, reject) => {
    install.addListener({
      onInstallEnded: (_, addon) => resolve(addon),
      onInstallFailed: () => reject(new Error(`Sip didn't install (${install.error})`)),
      onInstallCancelled: () => reject(new Error("Sip's install was cancelled")),
    });
    install.install();
  });
}

const signed = addon => addon.signedState > AddonManager.SIGNEDSTATE_MISSING;

// Whether to install the bundled copy, given what's installed (or null): only to replace an old
// Sip, to give a new profile its Sip, to update an older copy, or to swap an unsigned copy for the
// signed one at the same version. Never to bring back a Sip the person removed.
export function shouldInstallBundled({ installed, bundled, old, welcomePending }) {
  if (!installed) return !!old || welcomePending;
  const order = Services.vc.compare(installed.version, bundled.version);
  return order < 0 || (order === 0 && !signed(installed) && signed(bundled));
}

// Makes sure the bundled Sip is installed, and updates an older copy. Never reinstalls a Sip the
// person removed, never downgrades a newer copy from addons.mozilla.org, and keeps it on or off as
// it was (a replacement for the old id as the old one was). `welcomePending`: a new profile whose
// welcome hasn't asked about Sip yet, where it waits switched off.
export async function ensureBundledSip({ welcomePending = false } = {}) {
  const installed = await AddonManager.getAddonByID(SIP_ID);
  const file = bundledFile();
  if (!file) return installed;
  const old = await AddonManager.getAddonByID(OLD_SIP_ID);
  const install = await AddonManager.getInstallForFile(file);
  const bundled = install?.addon;
  if (!bundled) return installed;
  if (!shouldInstallBundled({ installed, bundled, old, welcomePending })) {
    install.cancel();
    return installed;
  }
  // On or off as before: an update keeps the copy's state, a replacement takes the old Sip's.
  const wasOff = installed ? installed.userDisabled : welcomePending || (!!old && !old.isActive);
  const started = sipStarted();
  const addon = await installAndWait(install);
  if (wasOff && !addon.userDisabled) await addon.disable();
  else await started;
  return addon;
}

// Sip learns it's inside Astrelle (no first-run page of its own; its settings mention Astrelle).
export async function markHost() {
  const { host } = await sipGet(["host"]);
  if (host !== "astrelle") await sipSet({ host: "astrelle" });
}

// ----- Moving the history from the old add-on id ------------------------------------------------

function failAfter(step) {
  if (Services.prefs.getStringPref(FAIL_AFTER, "") === step) throw new Error(`test: stopped after ${step}`);
}

// Every day the old storage held, in either shape: { dayKey: total }.
function oldDayTotals(data) {
  const totals = {};
  for (const [key, day] of Object.entries(data.days || {})) totals[key] = day?.total || 0;
  for (const [key, day] of Object.entries(data)) if (/^day\.\d{4}-\d{2}-\d{2}$/.test(key)) totals[key.slice(4)] = day?.total || 0;
  return totals;
}

function cutoffKey() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS);
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

let migrating = null;

// Moves the old Sip's history and settings to the new one, safely: the old copy keeps counting
// until the new one is installed; its data is backed up to <profile>/sip-migration/ before
// anything can be lost; the new Sip merges it (once, whatever happens: its `ack` makes a replay a
// no-op); Astrelle checks the merged totals; and only then is the old add-on uninstalled. Any
// failure leaves the old data where it is, and the next start carries on with the same id.
export function migrateSip() {
  migrating ??= migrate()
    .then(() => Services.prefs.clearUserPref(LAST_ERROR))
    .catch(error => {
      console.error("Astrelle: moving Sip's history", error);
      Services.prefs.setStringPref(LAST_ERROR, String(error?.message ?? error)); // shown in about:config
    })
    .finally(() => { migrating = null; });
  return migrating;
}

// Waits until Firefox really runs an add-on: just after a start the add-on manager can call it
// active before its policy is, and its storage opens only once the policy is.
async function running(id, ms = 15000) {
  for (let waited = 0; !WebExtensionPolicy.getByID(id)?.active; waited += 100) {
    if (waited >= ms) return false;
    await new Promise(r => setTimeout(r, 100));
  }
  return true;
}

// Turns an add-on on and waits until it runs, and for Sip, until it has made its storage.
async function turnOn(addon) {
  const started = addon.id === SIP_ID && !addon.isActive ? sipStarted() : null;
  if (!addon.isActive) await addon.enable();
  if (!(await running(addon.id))) throw new Error(`${addon.id} didn't start`);
  await started;
}

// Everything an add-on keeps in storage.local, or an error: never an empty object for a storage
// that couldn't be opened, which the move would otherwise take for "no history".
async function readAll(id) {
  if (!(await running(id))) throw new Error(`${id} isn't running, so its storage can't be read`);
  const db = await sipDb(id);
  if (!db) throw new Error(`${id}'s storage didn't open`);
  return db.get(null);
}

const backupPath = id => PathUtils.join(PathUtils.profileDir, "sip-migration", `${id}.json`);

// The move's state, saved at once (a crash shouldn't lose which step it reached).
function setState(value) {
  Services.prefs.setStringPref(MIGRATION, value);
  Services.prefs.savePrefFile(null);
}

// Hands `data` to Sip under `id` (a no-op if Sip already took it: its ack), waits for Sip to take
// it, and checks every old day still kept is there before anything is deleted.
async function deliver(id, data) {
  const current = await readAll(SIP_ID);
  if (current.ack?.import !== id) await sipSet({ "cmd.import": { id, from: OLD_SIP_ID, at: Date.now(), data } });
  failAfter("import");
  if (!(await waitFor(stored => stored.ack?.import === id, 20000))) throw new Error("Sip didn't take the history yet");
  failAfter("ack");
  const merged = await readAll(SIP_ID);
  const cutoff = cutoffKey();
  const short = Object.entries(oldDayTotals(data)).filter(([key, total]) => key >= cutoff && (merged[`day.${key}`]?.total || 0) < total);
  if (short.length) throw new Error(`the merged history is short on ${short.length} day(s), e.g. ${short[0][0]}; the old Sip stays`);
}

async function finish(sip) {
  const placement = Services.prefs.getStringPref(OLD_PLACEMENT, "");
  if (placement) {
    const { area, position } = JSON.parse(placement);
    CustomizableUI.addWidgetToArea(SIP_WIDGET, area, position);
  } else {
    showSipButton();
  }
  await sipSet({ "opt.firstRunDone": true, host: "astrelle" });
  setState("done");
  Services.prefs.clearUserPref(OLD_PLACEMENT);
  console.info("Astrelle: Sip's history moved to the new add-on");
}

async function migrate() {
  const state = Services.prefs.getStringPref(MIGRATION, "");
  if (state === "done") {
    Services.prefs.clearUserPref(OLD_PLACEMENT); // left by a run cut short just after finishing
    return;
  }
  const old = await AddonManager.getAddonByID(OLD_SIP_ID);
  if (!old) {
    // A move cut short after the old add-on was removed finishes from its backup.
    const id = state.startsWith("pending:") ? state.slice(8) : null;
    if (id && (await IOUtils.exists(backupPath(id)))) {
      const sip = await AddonManager.getAddonByID(SIP_ID);
      if (!sip?.isActive) return; // when Sip is turned on
      const { data } = await IOUtils.readJSON(backupPath(id));
      await deliver(id, data);
      await finish(sip);
      return;
    }
    setState("done");
    return;
  }
  if (!Services.prefs.getBoolPref(`extensions.webextensions.ExtensionStorageIDB.migrated.${OLD_SIP_ID}`, false)) {
    console.warn("Astrelle: the old Sip's data isn't in the storage Astrelle reads; leaving it where it is");
    return;
  }
  const oldWasOn = old.isActive;
  const sip = await ensureBundledSip();
  if (!sip) throw new Error("the new Sip isn't installed; the old one keeps counting");
  // Sip's storage can only be written while it's on: the new one takes the old one's state, and
  // with both off the move waits until Sip is turned on (setSip calls this again).
  if (!sip.isActive) {
    if (!oldWasOn) return;
    await turnOn(sip);
  }
  const id = state.startsWith("pending:") ? state.slice(8) : Services.uuid.generateUUID().toString().slice(1, -1);
  if (!state.startsWith("pending:")) setState(`pending:${id}`);

  // The old add-on's data can only be read while it's on, so it's read (and backed up) first; an
  // old Sip that is off is turned on just for that. Its button's place, too, can only be read then.
  await turnOn(old);
  if (!Services.prefs.prefHasUserValue(OLD_PLACEMENT)) {
    const placement = CustomizableUI.getPlacementOfWidget(OLD_SIP_WIDGET);
    if (placement) Services.prefs.setStringPref(OLD_PLACEMENT, JSON.stringify({ area: placement.area, position: placement.position }));
  }
  const data = await readAll(OLD_SIP_ID);
  const backup = backupPath(id);
  await IOUtils.makeDirectory(PathUtils.parent(backup), { ignoreExisting: true });
  if (!(await IOUtils.exists(backup))) {
    await IOUtils.writeJSON(backup, { from: OLD_SIP_ID, at: Date.now(), data }, { tmpPath: backup + ".tmp", flush: true });
  }
  console.info(`Astrelle: the old Sip's data is backed up in ${backup}`);
  failAfter("backup");
  await old.disable(); // it stops counting; its data stays on disk until it's uninstalled
  failAfter("disable");
  await deliver(id, data);
  // Firefox writes add-on permissions to disk lazily, so the promise to keep private windows is
  // saved first, and kept on later starts until the new Sip has it (keepPrivatePromise).
  if ((await ExtensionPermissions.get(OLD_SIP_ID)).permissions.includes("internal:privateBrowsingAllowed")) {
    Services.prefs.setBoolPref(PRIVATE_PROMISE, true);
    Services.prefs.savePrefFile(null);
  }
  await keepPrivatePromise();
  await old.uninstall();
  await finish(sip);
}

// The old Sip was allowed in private windows, so the new one is, once it runs. The promise is
// kept until a later start finds the permission already there, which means Firefox saved it.
let grantedThisRun = false;
export async function keepPrivatePromise() {
  if (!Services.prefs.getBoolPref(PRIVATE_PROMISE, false)) return;
  const sip = await AddonManager.getAddonByID(SIP_ID);
  if (!sip?.isActive || !(await running(SIP_ID))) return;
  if (WebExtensionPolicy.getByID(SIP_ID)?.privateBrowsingAllowed) {
    if (!grantedThisRun) Services.prefs.clearUserPref(PRIVATE_PROMISE);
    return;
  }
  await allowPrivate(sip);
  grantedThisRun = true;
}

// ----- Small things others use ------------------------------------------------------------------

// Lets Sip count private windows (as one total, with no site names).
export async function allowPrivate(addon) {
  const policy = WebExtensionPolicy.getByID(addon.id);
  await ExtensionPermissions.add(addon.id, { permissions: ["internal:privateBrowsingAllowed"], origins: [] }, policy?.extension);
  if (addon.isActive && !WebExtensionPolicy.getByID(addon.id)?.privateBrowsingAllowed) await addon.reload();
}

// Sip's button, whose badge shows how much of the budget is used, sits on the toolbar beside the
// add-ons button rather than inside its menu, where the badge can't be seen.
export function showSipButton() {
  if (CustomizableUI.getPlacementOfWidget(SIP_WIDGET)?.area === CustomizableUI.AREA_NAVBAR) return;
  const addons = CustomizableUI.getPlacementOfWidget("unified-extensions-button");
  CustomizableUI.addWidgetToArea(SIP_WIDGET, CustomizableUI.AREA_NAVBAR, addons?.area === CustomizableUI.AREA_NAVBAR ? addons.position + 1 : undefined);
}

// ----- The browser's own media prefs follow Sip's autoplay saver ------------------------------

const MEDIA_PREFS = { "media.autoplay.default": 5, "media.preload.default": 1, "media.preload.auto": 1 };
const YOUTUBE_ORIGINS = ["https://www.youtube.com", "https://m.youtube.com", "https://music.youtube.com"];

function originsFor(sites) {
  const origins = [...YOUTUBE_ORIGINS];
  for (const [host, rules] of Object.entries(sites || {})) {
    if (rules?.autoplay === false && /^[a-z0-9.-]+$/.test(host)) origins.push(`https://${host}`, `https://www.${host}`);
  }
  return [...new Set(origins)];
}

function grant(origins) {
  const before = JSON.parse(Services.prefs.getStringPref(GRANTED, "[]"));
  for (const origin of before.filter(o => !origins.includes(o))) {
    Services.perms.removeFromPrincipal(Services.scriptSecurityManager.createContentPrincipalFromOrigin(origin), "autoplay-media");
  }
  for (const origin of origins.filter(o => !before.includes(o))) {
    Services.perms.addFromPrincipal(Services.scriptSecurityManager.createContentPrincipalFromOrigin(origin), "autoplay-media", Services.perms.ALLOW_ACTION);
  }
  if (origins.length) Services.prefs.setStringPref(GRANTED, JSON.stringify(origins));
  else Services.prefs.clearUserPref(GRANTED);
}

// While Sip runs with its autoplay saver on, the browser also blocks autoplay and preloads only
// what's needed, YouTube and the sites whose rule turns the saver off excepted (Sip's autoplay.js
// still decides which YouTube pages may play). Otherwise Firefox's own defaults come back.
export async function applySipMedia() {
  const addon = await AddonManager.getAddonByID(SIP_ID);
  const stored = addon?.isActive ? await sipGet(["opt.saver", "opt.autoplay", "opt.sites"]) : null;
  const on = !!stored && (stored["opt.saver"] ?? SIP_DEFAULTS.saver) && (stored["opt.autoplay"] ?? SIP_DEFAULTS.autoplay);
  for (const [pref, value] of Object.entries(MEDIA_PREFS)) {
    if (on) Services.prefs.setIntPref(pref, value);
    else Services.prefs.clearUserPref(pref);
  }
  grant(on ? originsFor(stored["opt.sites"]) : []);
  return on;
}

let followingMedia = false;
export function followSipMedia() {
  if (followingMedia) return applySipMedia();
  followingMedia = true;
  const again = () => applySipMedia().catch(error => console.error("Astrelle: Sip's media prefs", error));
  followSip(changes => {
    if (["opt.saver", "opt.autoplay", "opt.sites"].some(key => key in changes)) again();
  });
  const mine = addon => addon.id === SIP_ID && again();
  AddonManager.addAddonListener({ onEnabled: mine, onDisabled: mine, onInstalled: mine, onUninstalled: mine });
  return again();
}

// ----- Start-up ---------------------------------------------------------------------------------

let started = false;

// Once per run of the browser, in the background, so no window waits for it (each window's
// scripts run in turn, and moving the history can wait up to 20 seconds for Sip).
export function init() {
  if (started) return;
  started = true;
  const welcomePending = !Services.prefs.getBoolPref("aether.welcome.shown", false); // before welcome.mjs sets it
  (async () => {
    await ensureBundledSip({ welcomePending });
    await markHost();
    await migrateSip();
    await keepPrivatePromise();
    await followSipMedia();
  })().catch(error => console.error("Astrelle: Sip", error));
}
