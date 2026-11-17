// Astrelle has one icon, the same everywhere: the welcome, Astrelle Settings and the New Tab page
// show it, with no icon to choose (no step, no card, no link), in the Flatpak and out of it. An
// icon chosen once, of the several there were, is forgotten. Its colour theme by default is the
// orange one (sunset), as the icon.
const wait = ms => new Promise(r => setTimeout(r, ms));
const look = async () => {
  const welcome = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
  const settings = gBrowser.addTrustedTab("about:astrelle");
  gBrowser.selectedTab = settings;
  await wait(2500);
  const wdoc = welcome.linkedBrowser.contentDocument, sdoc = settings.linkedBrowser.contentDocument;
  const seen = {
    iconStep: !!wdoc.querySelector('.step[data-step="icon"]'),
    pictures: [...wdoc.querySelectorAll(".orb"), sdoc.getElementById("logo")].map(img => img.src.split("/").pop()),
    favicons: [wdoc, sdoc].map(doc => doc.querySelector('link[rel="icon"]').href.split("/").pop()),
    iconCard: !!sdoc.getElementById("icon") || !!sdoc.querySelector(".app-icon-card"),
    iconLink: !!sdoc.querySelector('a[href="#icon"]'),
    palette: sdoc.documentElement.getAttribute("aether-palette"),
  };
  gBrowser.removeTab(welcome);
  gBrowser.removeTab(settings);
  return seen;
};
const outside = await look();
Services.env.set("FLATPAK_ID", "io.github.osamafoda.Astrelle");
const inside = await look();
Services.env.set("FLATPAK_ID", "");
const icon = await fetch("chrome://aether/content/icons/astrelle.svg");
const one = s => !s.iconStep && !s.iconCard && !s.iconLink && s.pictures.length > 1
  && [...s.pictures, ...s.favicons].every(name => name === "astrelle.svg");
const ok = icon.ok && one(outside) && one(inside) && outside.palette === "sunset" && document.documentElement.getAttribute("aether-palette") === "sunset";
return { ok, iconFile: icon.ok, outside, inside, windowPalette: document.documentElement.getAttribute("aether-palette") };
