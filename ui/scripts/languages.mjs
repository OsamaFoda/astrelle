// Astrelle in the person's language. It follows the system's language (aether.cfg sets
// intl.locale.requested to "", which means just that), or the one chosen in Astrelle Settings.
// Astrelle's own parts come from ui/locales/; Firefox's own menus and dialogs come from Mozilla's
// language pack for that language, which Astrelle offers to download (signed by Mozilla, from its
// release archive, under 1 MB) the first time it's missing, rather than making every download
// carry all of them.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { setTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
import { tr } from "./l10n.mjs";

// The languages Firefox ships in (its release archive's xpi/ folder).
export const LOCALES = ["ach", "af", "an", "ar", "ast", "az", "be", "bg", "bn", "br", "bs", "ca", "ca-valencia", "cak", "cs", "cy",
  "da", "de", "dsb", "el", "en-CA", "en-GB", "en-US", "eo", "es-AR", "es-CL", "es-ES", "es-MX", "et", "eu", "fa", "ff", "fi", "fr",
  "fur", "fy-NL", "ga-IE", "gd", "gl", "gn", "gu-IN", "he", "hi-IN", "hr", "hsb", "hu", "hy-AM", "ia", "id", "is", "it", "ja", "ka",
  "kab", "kk", "km", "kn", "ko", "lij", "lt", "lv", "mk", "mr", "ms", "my", "nb-NO", "ne-NP", "nl", "nn-NO", "oc", "pa-IN", "pl",
  "pt-BR", "pt-PT", "rm", "ro", "ru", "sat", "sc", "sco", "si", "sk", "skr", "sl", "son", "sq", "sr", "sv-SE", "szl", "ta", "te",
  "tg", "th", "tl", "tr", "trs", "uk", "ur", "uz", "vi", "xh", "zh-CN", "zh-TW"];

const DECLINED = "aether.languages.declined"; // languages the offer was turned down for
const PACK_URL = "aether.languages.packURL";   // tests point this at a local file

export const nameOf = locale => {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(locale);
  } catch {
    return locale;
  }
};

// The language Astrelle is set to follow: the chosen one, or the system's.
export function wantedLocale() {
  const chosen = Services.prefs.getStringPref("intl.locale.requested", "");
  if (chosen) return chosen.split(",")[0];
  const os = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
  return os.systemLocales[0] ?? "en-US";
}

// Firefox's language closest to `locale` (ar-EG -> ar, pt -> pt-BR), or null.
export function firefoxLocaleFor(locale) {
  return Services.locale.negotiateLanguages([locale], LOCALES, "", Services.locale.langNegStrategyLookup)[0] || null;
}

const packId = locale => `langpack-${locale}@firefox.mozilla.org`;

// Whether Firefox's own strings exist in this language here (built in, or a language pack).
export async function hasFirefoxStrings(locale) {
  if (Services.locale.packagedLocales.includes(locale)) return true;
  return !!(await AddonManager.getAddonByID(packId(locale)))?.isActive;
}

// Downloads and installs Mozilla's language pack for this Firefox version.
export async function installLanguage(locale) {
  const version = Services.appinfo.version;
  const template = Services.prefs.getStringPref(PACK_URL,
    "https://archive.mozilla.org/pub/firefox/releases/{version}esr/linux-x86_64/xpi/{locale}.xpi");
  const install = await AddonManager.getInstallForURL(template.replace("{version}", version).replace("{locale}", locale),
    { telemetryInfo: { source: "aether-languages" } });
  return new Promise((resolve, reject) => {
    install.addListener({
      onInstallEnded: (_, addon) => resolve(addon),
      onDownloadFailed: () => reject(new Error("download")),
      onInstallFailed: () => reject(new Error("install")),
      onDownloadCancelled: () => reject(new Error("cancelled")),
      onInstallCancelled: () => reject(new Error("cancelled")),
    });
    install.install();
  });
}

// "" follows the system.
export function setLanguage(locale) {
  Services.prefs.setStringPref("intl.locale.requested", locale);
}

export function restart() {
  Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
}

const declined = () => Services.prefs.getStringPref(DECLINED, "").split(",").filter(Boolean);

// The bar that offers Firefox's strings in the person's language, once per language.
export async function offerLanguage(win) {
  const locale = firefoxLocaleFor(wantedLocale());
  if (!locale || locale.startsWith("en") || declined().includes(locale) || (await hasFirefoxStrings(locale))) return false;
  // Above the page, where it has room (the window's own bar sits in the narrow sidebar).
  const box = win.gBrowser.getNotificationBox();
  if (box.getNotificationWithValue("aether-language")) return true;
  const name = nameOf(locale);
  const bar = await box.appendNotification("aether-language", {
    label: tr("astrelle-language-offer", { language: name }),
    priority: box.PRIORITY_INFO_MEDIUM,
  }, [
    {
      label: tr("astrelle-language-download"),
      callback: () => {
        installLanguage(locale).then(() => {
          box.appendNotification("aether-language-restart", {
            label: tr("astrelle-language-restart-to", { language: name }),
            priority: box.PRIORITY_INFO_MEDIUM,
          }, [{ label: tr("astrelle-language-restart"), callback: restart }]);
        }, () => {
          box.appendNotification("aether-language-failed", { label: tr("astrelle-language-failed"), priority: box.PRIORITY_WARNING_LOW }, []);
        });
        return false;
      },
    },
    {
      label: tr("astrelle-language-not-now"),
      callback: () => Services.prefs.setStringPref(DECLINED, [...declined(), locale].join(",")),
    },
  ]);
  return !!bar;
}

let asked = false;
export function init(win) {
  if (asked) return;
  asked = true;
  // After start-up has settled, so it never slows it.
  setTimeout(() => offerLanguage(win).catch(error => console.error("Astrelle: languages", error)), 5000);
}
