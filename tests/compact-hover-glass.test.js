// timeout: 60
// Frosted Glass, compact mode set to Hover: the sidebar (or the top toolbar) hovering over the page
// shows the page frosted behind it (a snapshot of the part under it, blurred;
// scripts/hover-glass.mjs), placed where that part is: the part showing, on a page scrolled down,
// and staying put while the bar slides away over it. Set to Slide, the wallpaper is behind it and
// its own glass blurs that: no snapshot. Once the bar is gone, the picture is wiped from memory;
// in a private window none is taken (the hovering bar is solid).
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const root = document.documentElement;
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.setBoolPref("aether.compactMode", true);
gBrowser.selectedTab = gBrowser.addTrustedTab("about:mozilla");
const out = {};
for (const [vertical, reveal] of [[true, "over"], [false, "over"], [true, "push"]]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  Services.prefs.setStringPref("aether.compactReveal", reveal);
  root.removeAttribute("aether-hover-backdrop");
  move(innerWidth / 2, innerHeight / 2);
  await wait(1500);
  move(vertical ? 2 : innerWidth / 2, vertical ? innerHeight / 2 : 2);
  await wait(400);
  move(vertical ? 100 : innerWidth / 2, vertical ? innerHeight / 2 : 40);
  await wait(900);
  const bar = document.getElementById(vertical ? "sidebar-container" : "navigator-toolbox");
  out[`${vertical ? "sidebar" : "top"} ${reveal}`] = {
    frosted: /-moz-element/.test(getComputedStyle(bar, "::after").backgroundImage),
    at: bar.style.getPropertyValue("--aether-hover-at"),
  };
}
// The colour of the window at a point: the bar's, where it's over it.
const colourAt = (x, y) => {
  const c = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  c.width = c.height = 2;
  const context = c.getContext("2d");
  context.drawWindow(window, x, y, 2, 2, "white");
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return g > 200 && b < 120 ? "green" : b > 200 && g < 120 ? "blue" : r > 200 && g < 120 ? "red" : `${r},${g},${b}`;
};
// Scrolled down a page that's red at the top and, further down, green on the left and blue: the
// sidebar shows green and blue, as the page does where it is now.
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
Services.prefs.setStringPref("aether.compactReveal", "over");
const page = '<body style="margin:0"><div style="height:3000px;background:red"></div>'
  + '<div id="b" style="height:3000px;background:linear-gradient(90deg,lime 150px,blue 150px)"></div>';
const scrolled = gBrowser.addTrustedTab("data:text/html," + encodeURIComponent(page) + "#b");
gBrowser.selectedTab = scrolled;
move(innerWidth / 2, innerHeight / 2);
await wait(2000);
move(2, innerHeight / 2); await wait(400); move(100, innerHeight / 2); await wait(900);
const sidebar = document.getElementById("sidebar-container");
const middle = sidebar.getBoundingClientRect().top + sidebar.offsetHeight / 2;
out.scrolled = [colourAt(100, middle), colourAt(200, middle)].join(" ");
// Sliding away: still green and blue there, while the sidebar still covers them. The slide is
// frozen 40% of the way (it runs on the graphics card, where scripts only see where it is now and
// then), its glass's counter-slide with it.
move(innerWidth / 2, innerHeight / 2);
let slides = [];
for (let i = 0; i < 40 && !slides.length; i++) {
  await wait(25);
  slides = sidebar.getAnimations({ subtree: true }).filter(a => a.transitionProperty === "transform");
}
for (const a of slides) {
  const { delay, duration } = a.effect.getComputedTiming();
  a.pause();
  a.currentTime = delay + duration * 0.4;
}
await wait(50);
const sliding = new Set();
const right = sidebar.getBoundingClientRect().right;
if (slides.length && right > 206 && right < 249) sliding.add([colourAt(100, middle), colourAt(200, middle)].join(" "));
out.slideFrozenAt = Math.round(right);
for (const a of slides) a.finish();
out.sliding = [...sliding];
gBrowser.removeTab(scrolled);
// Gone: wiped (the canvas emptied) within a moment.
Services.prefs.setBoolPref("sidebar.verticalTabs", true);
Services.prefs.setStringPref("aether.compactReveal", "over");
move(innerWidth / 2, innerHeight / 2);
await wait(1500);
move(2, innerHeight / 2); await wait(400); move(100, innerHeight / 2); await wait(700);
const shownWhileOut = root.hasAttribute("aether-hover-backdrop");
move(innerWidth / 2, innerHeight / 2);
await wait(1200);
out.wipedOnceGone = shownWhileOut && !root.hasAttribute("aether-hover-backdrop");
// A private window: none taken.
const priv = OpenBrowserWindow({ private: true });
await new Promise(r => priv.addEventListener("load", r, { once: true }));
await wait(2500);
const pmove = (x, y) => priv.synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
pmove(priv.innerWidth / 2, priv.innerHeight / 2); await wait(800);
pmove(2, priv.innerHeight / 2); await wait(400); pmove(100, priv.innerHeight / 2); await wait(900);
out.privateFrosted = /-moz-element/.test(priv.getComputedStyle(priv.document.getElementById("sidebar-container"), "::after").backgroundImage)
  || priv.document.documentElement.hasAttribute("aether-hover-backdrop");
priv.close();
move(innerWidth / 2, innerHeight / 2);
for (const p of ["aether.liquidGlass", "aether.compactMode", "sidebar.verticalTabs", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
const ok = out["sidebar over"].frosted && out["top over"].frosted && out["top over"].at === "8px 8px" && !out["sidebar push"].frosted
  && out.scrolled === "green blue" && out.sliding.length > 0 && out.sliding.every(s => s === "green blue")
  && out.wipedOnceGone && out.privateFrosted === false;
return { ok, ...out };
