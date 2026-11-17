// Veil: Astrelle's ad and tracker blocking. Underneath it's uBlock Origin, unmodified and credited
// (Astrelle Settings), installed from Mozilla's add-on site and updating itself, as LibreWolf and
// Mullvad Browser ship it. What Veil adds is stronger starting lists, as Brave's Shields have: more
// ad lists, phishing, tracking parameters stripped from links, cookie notices, "open in the app"
// banners, newsletter and notification nags, and the regional lists for the languages you use
// and the country you're in (uBlock picks regional lists by the browser's language alone).
//
// They're added once, to whatever uBlock has chosen (so nothing anyone picked is undone), when
// uBlock is installed or the first time Astrelle finds it without them; then uBlock reloads to
// load them. After that its lists are yours to change in its own settings: nothing puts them back.
// uBlock keeps its choice in its storage, as "selectedFilterLists"; that's what's added to.

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { ExtensionStorageIDB } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorageIDB.sys.mjs");
const { setTimeout } = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
const { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

export const UBLOCK = "uBlock0@raymondhill.net";
// uBlock's button (the count of what it blocked on the page, and its switch for the site), on the
// toolbar beside the add-ons button: in the sidebar, the row of tools at its bottom.
export const UBLOCK_WIDGET = "ublock0_raymondhill_net-browser-action";
const ADDED = "aether.veil.lists"; // which version of Veil's lists has been added
const VERSION = 1;

// uBlock's names for the lists (its assets.json).
export const VEIL_LISTS = [
  "adguard-generic",            // AdGuard – Ads
  "curben-phishing",            // Phishing URL Blocklist
  "adguard-spyware-url",        // AdGuard/uBO – URL Tracking Protection
  "fanboy-cookiemonster",       // EasyList – Cookie Notices
  "ublock-cookies-easylist",    // uBlock filters – Cookie Notices (EasyList's companion)
  "adguard-mobile-app-banners", // AdGuard – Mobile App Banners
  "easylist-newsletters",       // EasyList – Newsletter Notices
  "easylist-notifications",     // EasyList – Notifications
];

// Languages to uBlock's regional lists (from the "lang" of each in its assets.json).
const REGIONAL = {"af":["NLD-0"],"an":["spa-0","spa-1"],"ar":["ara-0","FRA-0"],"as":["IND-0"],"ast":["spa-0","spa-1"],"be":["RUS-0"],"bg":["BGR-0"],"bn":["IND-0"],"br":["FRA-0"],"bs":["HRV-0"],"ca":["spa-0","spa-1"],"cak":["spa-0","spa-1"],"cs":["CZE-0"],"da":["NOR-0"],"de":["DEU-0"],"dsb":["DEU-0"],"el":["GRC-0"],"es":["spa-0","spa-1"],"et":["EST-0"],"eu":["spa-0","spa-1"],"fa":["IRN-0"],"ff":["FRA-0"],"fi":["FIN-0"],"fr":["FRA-0"],"fur":["ITA-0"],"fy":["NLD-0"],"gl":["spa-0","spa-1"],"gn":["spa-0","spa-1"],"gu":["IND-0"],"he":["ISR-0"],"hi":["IND-0"],"hr":["HRV-0"],"hsb":["DEU-0"],"hu":["HUN-0"],"id":["IDN-0"],"is":["ISL-0","NOR-0"],"it":["ITA-0"],"ja":["JPN-1"],"kab":["ara-0","FRA-0"],"kk":["RUS-0"],"kn":["IND-0"],"ko":["KOR-1"],"lb":["DEU-0","FRA-0"],"lij":["ITA-0"],"lt":["LTU-0"],"lv":["LVA-0"],"mk":["BGR-0","MKD-0"],"ml":["IND-0"],"mr":["IND-0"],"ms":["IDN-0"],"nb":["NOR-0"],"ne":["IND-0"],"nl":["NLD-0"],"nn":["NOR-0"],"no":["NOR-0"],"oc":["FRA-0"],"pa":["IND-0"],"pl":["POL-0","POL-3"],"ps":["IRN-0"],"pt":["spa-1"],"quz":["spa-0","spa-1"],"rm":["DEU-0"],"ro":["ROU-1"],"ru":["RUS-0"],"sat":["IND-0"],"sc":["ITA-0"],"si":["IND-0"],"sk":["CZE-0"],"sl":["SVN-0"],"son":["FRA-0"],"sq":["ALB-0"],"sr":["HRV-0"],"sv":["SWE-1"],"szl":["POL-0","POL-3"],"ta":["IND-0"],"te":["IND-0"],"tg":["IRN-0"],"th":["THA-0"],"tr":["TUR-0"],"trs":["spa-0","spa-1"],"tt":["RUS-0"],"ug":["CHN-0"],"uk":["UKR-0"],"uz":["RUS-0"],"vi":["VIE-1"],"zh":["CHN-0"]};

// Countries' languages, from the time zone: the country you're in, whatever language your
// computer speaks (an Egyptian on a French computer still reads Arabic sites).
const ZONES = {
  "Africa/Cairo": "ar", "Africa/Algiers": "ar", "Africa/Casablanca": "ar", "Africa/Tunis": "ar", "Africa/Tripoli": "ar",
  "Africa/Khartoum": "ar", "Asia/Riyadh": "ar", "Asia/Dubai": "ar", "Asia/Qatar": "ar", "Asia/Bahrain": "ar",
  "Asia/Kuwait": "ar", "Asia/Muscat": "ar", "Asia/Aden": "ar", "Asia/Baghdad": "ar", "Asia/Amman": "ar",
  "Asia/Beirut": "ar", "Asia/Damascus": "ar", "Asia/Gaza": "ar", "Asia/Hebron": "ar",
  "Asia/Tehran": "fa", "Europe/Istanbul": "tr", "Asia/Jerusalem": "he", "Europe/Moscow": "ru", "Europe/Kyiv": "uk",
  "Europe/Paris": "fr", "Europe/Berlin": "de", "Europe/Vienna": "de", "Europe/Madrid": "es", "Europe/Rome": "it",
  "Europe/Amsterdam": "nl", "Europe/Warsaw": "pl", "Europe/Prague": "cs", "Europe/Budapest": "hu", "Europe/Bucharest": "ro",
  "Europe/Athens": "el", "Europe/Sofia": "bg", "Europe/Helsinki": "fi", "Europe/Stockholm": "sv", "Europe/Oslo": "no",
  "Asia/Tokyo": "ja", "Asia/Seoul": "ko", "Asia/Shanghai": "zh", "Asia/Bangkok": "th", "Asia/Ho_Chi_Minh": "vi",
  "Asia/Jakarta": "id", "Asia/Kolkata": "hi", "America/Mexico_City": "es", "America/Bogota": "es",
  "America/Argentina/Buenos_Aires": "es", "America/Sao_Paulo": "pt",
};

// The languages to cover: Astrelle's, the computer's, and the country's.
export function languages() {
  const tags = [...Services.locale.appLocalesAsBCP47, ...Services.locale.regionalPrefsLocales];
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (ZONES[zone]) tags.push(ZONES[zone]);
  return [...new Set(tags.map(tag => tag.split("-")[0].toLowerCase()))];
}

export function regionalLists(langs = languages()) {
  return [...new Set(langs.flatMap(lang => REGIONAL[lang] ?? []))];
}

// uBlock's storage (Firefox's IndexedDB storage for add-ons), or null if it isn't there yet, is
// restarting (it can't be opened then), or uses the old storage, where Veil leaves it alone.
async function storage() {
  const extension = WebExtensionPolicy.getByID(UBLOCK)?.extension;
  if (!extension || !ExtensionStorageIDB.isMigratedExtension(extension)) return null;
  try {
    return await ExtensionStorageIDB.open(ExtensionStorageIDB.getStoragePrincipal(extension));
  } catch {
    return null;
  }
}

// Adds Veil's lists to uBlock's, once uBlock has made its own first choice (a new uBlock does it
// as it first starts: wait up to `patience` ms for it), then reloads uBlock; and puts its button
// on the toolbar. Returns the lists added, or null if it couldn't yet.
export async function addVeilLists({ patience = 0 } = {}) {
  let selected;
  for (const start = Date.now(); ; await new Promise(r => setTimeout(r, 500))) {
    selected = (await (await storage())?.get(["selectedFilterLists"]))?.selectedFilterLists;
    if (Array.isArray(selected) || Date.now() - start >= patience) break;
  }
  if (!Array.isArray(selected)) return null;
  const added = [...VEIL_LISTS, ...regionalLists()].filter(key => !selected.includes(key));
  if (added.length) {
    await (await storage()).set({ selectedFilterLists: [...selected, ...added] });
    // uBlock reads its lists as it starts: off and on again loads them.
    const addon = await AddonManager.getAddonByID(UBLOCK);
    if (addon?.isActive) {
      await addon.disable();
      await addon.enable();
    }
  }
  // (After the restart, which would put it back where a new add-on's button goes.)
  if (CustomizableUI.getPlacementOfWidget(UBLOCK_WIDGET)?.area !== CustomizableUI.AREA_NAVBAR) {
    const addons = CustomizableUI.getPlacementOfWidget("unified-extensions-button");
    CustomizableUI.addWidgetToArea(UBLOCK_WIDGET, CustomizableUI.AREA_NAVBAR, addons?.area === CustomizableUI.AREA_NAVBAR ? addons.position + 1 : undefined);
  }
  Services.prefs.setIntPref(ADDED, VERSION);
  return added;
}

// A uBlock that hasn't had Veil's lists yet (installed before Veil, or by hand) gets them once,
// a little after start-up.
let started = false;
export function init() {
  if (started) return;
  started = true;
  if (Services.prefs.getIntPref(ADDED, 0) >= VERSION) return;
  setTimeout(async () => {
    try {
      const addon = await AddonManager.getAddonByID(UBLOCK);
      if (addon?.isActive) await addVeilLists({ patience: 30000 });
    } catch (e) {
      console.error("Astrelle: Veil", e);
    }
  }, 8000);
}
