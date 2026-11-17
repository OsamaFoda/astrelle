// In the Flatpak, the icon is the one its package gives the desktop: the welcome has no icon step
// (and one dot fewer), Astrelle Settings no App icon card or link to it, and the pages show
// Eclipse whatever aether.appIcon says. Outside it, both are there.
const wait = ms => new Promise(r => setTimeout(r, ms));
const look = async () => {
  const welcome = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
  const settings = gBrowser.addTrustedTab("about:astrelle");
  gBrowser.selectedTab = settings;
  await wait(2500);
  const wdoc = welcome.linkedBrowser.contentDocument, sdoc = settings.linkedBrowser.contentDocument;
  const seen = {
    iconStep: !!wdoc.querySelector('.step[data-step="icon"]'),
    dots: wdoc.querySelector(".dots").children.length,
    steps: wdoc.querySelectorAll(".step").length,
    iconCard: !!sdoc.getElementById("icon"),
    iconLink: !!sdoc.querySelector('a[href="#icon"]'),
    favicon: sdoc.querySelector('link[rel="icon"]').href.split("/").pop(),
  };
  gBrowser.removeTab(welcome);
  gBrowser.removeTab(settings);
  return seen;
};
Services.prefs.setStringPref("aether.appIcon", "comet-sunrise");
const outside = await look();
Services.env.set("FLATPAK_ID", "io.github.osamafoda.Astrelle");
const inside = await look();
Services.env.set("FLATPAK_ID", "");
Services.prefs.clearUserPref("aether.appIcon");
const ok = outside.iconStep && outside.iconCard && outside.iconLink && outside.favicon === "comet-sunrise.svg"
  && !inside.iconStep && inside.dots === inside.steps && inside.dots === outside.dots - 1
  && !inside.iconCard && !inside.iconLink && inside.favicon === "eclipse.svg";
return { ok, outside, inside };
