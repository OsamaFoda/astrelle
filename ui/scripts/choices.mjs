// Astrelle's settings as the welcome and the Settings page (about:astrelle) change them. Each choice
// is a preference, applied the moment it's picked. Also the two add-ons they can turn on:
// protection (uBlock Origin, downloaded from Mozilla's add-on site) and Sip (built in), whose
// settings are written into Sip's own storage (scripts/sip.mjs), one key per setting.

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
const { setTimeout, clearTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
import { DEFAULT_PALETTE } from "./palette.mjs";
import { allowPrivate, followSip, followSipMedia, migrateSip, showSipButton, SIP_DEFAULTS, SIP_ID, SIP_WIDGET, sipGet, sipSet, sipStarted, YOUTUBE_CHOICES } from "./sip.mjs";

export { showSipButton };

const DARK = "ui.systemUsesDarkTheme";
const UBLOCK = "uBlock0@raymondhill.net";
// Where protection comes from; a pref so tests can point it at a local file.
const UBLOCK_URL = Services.prefs.getStringPref("aether.welcome.protectionURL",
  "https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi");

// The choices shown as a row of buttons: value <-> preference.
export const CHOICES = {
  theme: {
    get: () => !Services.prefs.prefHasUserValue(DARK) ? "system" : Services.prefs.getIntPref(DARK) ? "dark" : "light",
    set: value => value === "system" ? Services.prefs.clearUserPref(DARK) : Services.prefs.setIntPref(DARK, value === "dark" ? 1 : 0),
  },
  layout: {
    get: () => Services.prefs.getBoolPref("sidebar.verticalTabs", true) ? "sidebar" : "top",
    set: value => Services.prefs.setBoolPref("sidebar.verticalTabs", value === "sidebar"),
  },
  glass: {
    get: () => Services.prefs.getBoolPref("aether.liquidGlass", false) ? "liquid" : "glass",
    set: value => Services.prefs.setBoolPref("aether.liquidGlass", value === "liquid"),
  },
  palette: {
    get: () => Services.prefs.getStringPref("aether.palette", DEFAULT_PALETTE),
    set: value => Services.prefs.setStringPref("aether.palette", value),
  },
  background: {
    get: () => Services.prefs.getStringPref("aether.background", "wallpaper") === "desktop" ? "desktop" : "wallpaper",
    set: value => Services.prefs.setStringPref("aether.background", value),
  },
  lastTab: {
    get: () => Services.prefs.getBoolPref("browser.tabs.closeWindowWithLastTab", true) ? "close" : "keep",
    set: value => Services.prefs.setBoolPref("browser.tabs.closeWindowWithLastTab", value === "close"),
  },
  reveal: {
    get: () => Services.prefs.getStringPref("aether.compactReveal", "push") === "over" ? "over" : "push",
    set: value => Services.prefs.setStringPref("aether.compactReveal", value),
  },
  startup: {
    get: () => Services.prefs.getIntPref("browser.startup.page", 3) === 3 ? "continue" : "fresh",
    set: value => Services.prefs.setIntPref("browser.startup.page", value === "continue" ? 3 : 1),
  },
  newTabs: {
    get: () => Services.prefs.getStringPref("aether.newTabsAt", "top") === "bottom" ? "bottom" : "top",
    set: value => Services.prefs.setStringPref("aether.newTabsAt", value),
  },
};

// "on", "off", or "missing" (not installed).
async function state(id) {
  const addon = await AddonManager.getAddonByID(id);
  return !addon ? "missing" : addon.isActive ? "on" : "off";
}

export const protectionState = () => state(UBLOCK);
export const sipState = () => state(SIP_ID);

export async function setProtection(on) {
  const existing = await AddonManager.getAddonByID(UBLOCK);
  if (!on) {
    await existing?.disable();
    return;
  }
  if (existing) {
    if (!existing.isActive) await existing.enable();
    return;
  }
  const install = await AddonManager.getInstallForURL(UBLOCK_URL, { telemetryInfo: { source: "aether-welcome" } });
  const addon = await new Promise((resolve, reject) => {
    install.addListener({
      onInstallEnded: (_, installed) => resolve(installed),
      onDownloadFailed: () => reject(new Error("download")),
      onInstallFailed: () => reject(new Error("install")),
      onDownloadCancelled: () => reject(new Error("cancelled")),
      onInstallCancelled: () => reject(new Error("cancelled")),
    });
    install.install();
  });
  // Protect private windows too.
  await ExtensionPermissions.add(addon.id, { permissions: ["internal:privateBrowsingAllowed"], origins: [] });
}

// Turning Sip on also lets it count private windows (as one total, with no site names), marks it
// set up (Astrelle asked the questions), puts its button on the toolbar, and moves an old Sip's
// history over if one is waiting for Sip to be on.
export async function setSip(on) {
  const addon = await AddonManager.getAddonByID(SIP_ID);
  if (!addon) return;
  if (!on) {
    if (addon.isActive) await addon.disable();
    return;
  }
  if (!addon.isActive) {
    const started = sipStarted();
    await addon.enable();
    await started;
  }
  await allowPrivate(addon);
  await sipSet({ "opt.firstRunDone": true, host: "astrelle" });
  showSipButton();
  followSipMedia();
  migrateSip();
}

// Checked as Sip checks them (lib/settings.js): a budget in GB rounded to 0.01, 0 or less for none;
// a day of the month from 1 to 31.
const toBudget = value => {
  const n = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};
const toDay = value => Math.min(Math.max(Math.round(Number(value)) || 1, 1), 31);

// { budgetGB, period } from Sip's storage; a missing key is Sip's default.
export async function readSipBudget() {
  const stored = await sipGet(["opt.budgetGB", "opt.period"]);
  return { budgetGB: stored["opt.budgetGB"] ?? SIP_DEFAULTS.budgetGB, period: stored["opt.period"] ?? { ...SIP_DEFAULTS.period } };
}

// The budget and the monthly renewal day. A value back at Sip's default is removed rather than
// written, as Sip does; a period of every N days (only Sip's settings offer it) is left alone.
export async function saveSipBudget(budgetGB, day) {
  budgetGB = toBudget(budgetGB);
  const { period } = await readSipBudget();
  const items = {};
  const remove = [];
  if (budgetGB) items["opt.budgetGB"] = budgetGB;
  else remove.push("opt.budgetGB");
  const monthly = period.kind !== "days";
  if (monthly && day !== undefined) {
    day = toDay(day);
    if (day === SIP_DEFAULTS.period.day) remove.push("opt.period");
    else items["opt.period"] = { kind: "monthly", day };
  }
  await sipSet(items, remove);
  return { budgetGB, day: monthly ? toDay(day ?? period.day) : null };
}

// Sip's highest YouTube quality, in lines (0 = no limit): only ever the person's own choice.
export async function saveSipYoutube(lines) {
  const n = Number(lines);
  if (!YOUTUBE_CHOICES.includes(n)) return;
  if (n === SIP_DEFAULTS.youtube) await sipSet({}, ["opt.youtube"]);
  else await sipSet({ "opt.youtube": n });
}

export async function readSipYoutube() {
  return (await sipGet(["opt.youtube"]))["opt.youtube"] ?? SIP_DEFAULTS.youtube;
}

// What the carrier says was used this period, in GB. Sip works out the rest (what it didn't see)
// and acknowledges; true once it has, within 5 seconds.
export async function saveSipUsedSoFar(gb) {
  const usedSoFar = Math.round(toBudget(gb) * 1e9);
  if (!usedSoFar) return false;
  const id = Services.uuid.generateUUID().toString().slice(1, -1);
  await sipSet({ "cmd.carrier": { id, usedSoFar } });
  for (let tries = 0; tries < 50; tries++) {
    if ((await sipGet(["ack"])).ack?.carrier === id) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

// The summary Sip publishes after every change (see Sip's lib/summary.js), or null.
export async function readSipSummary() {
  const { summary } = await sipGet(["summary"]);
  return summary?.v ? summary : null;
}

// Sip's popup if its button is in this window, else its settings in a new tab.
export function openSip(win) {
  const node = CustomizableUI.getWidget(SIP_WIDGET)?.forWindow(win)?.node;
  if (node && node.checkVisibility?.() !== false && win.document.contains(node)) {
    node.click();
    return;
  }
  const url = WebExtensionPolicy.getByID(SIP_ID)?.getURL("options.html");
  if (url) win.openTrustedLinkIn(url, "tab");
}

// Calls back whenever Sip's settings, summary or acknowledgements change, from here or from Sip
// itself; returns what stops it.
export function followSipSettings(callback) {
  return followSip(changes => {
    if (Object.keys(changes).some(key => key.startsWith("opt.") || key === "summary" || key === "ack")) callback();
  });
}
