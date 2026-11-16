// On Astrelle's first launch, opens the welcome page (ui/welcome/), which sets up the look and offers
// protection (uBlock Origin) and Sip. Sip ships inside Astrelle but stays off until it's chosen
// there. Shown once per profile (the aether.welcome.shown pref); after that, everything it sets
// is in Astrelle Settings (scripts/about-aether.mjs).

const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
import { SIP_ID } from "./sip.mjs";

const PREF = "aether.welcome.shown";
const WELCOME = "chrome://aether/content/welcome/welcome.html";

export async function init(win) {
  if (Services.prefs.getBoolPref(PREF, false)) return;
  Services.prefs.setBoolPref(PREF, true); // before anything async, so a second window doesn't open it too

  const sip = await AddonManager.getAddonByID(SIP_ID);
  if (sip?.isActive) await sip.disable();

  win.gBrowser.selectedTab = win.gBrowser.addTrustedTab(WELCOME);
}
