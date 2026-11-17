// timeout: 45
// Tabs on top, compact mode hovering over the page, in the Standard look: the toolbar coming down
// over the page has a background of its own (and a shadow), so the page doesn't show through it.
// Pushing the page down instead, it sits on the window's colour, as without compact mode.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
Services.prefs.setBoolPref("sidebar.verticalTabs", false);
Services.prefs.setBoolPref("aether.liquidGlass", false);
Services.prefs.setBoolPref("aether.compactMode", true);
const out = {};
for (const reveal of ["over", "push"]) {
  Services.prefs.setStringPref("aether.compactReveal", reveal);
  move(innerWidth / 2, innerHeight / 2); await wait(1200);
  move(innerWidth / 2, 2); await wait(400); move(innerWidth / 2, 40); await wait(900);
  const style = getComputedStyle(document.getElementById("navigator-toolbox"));
  out[reveal] = { out: document.getElementById("navigator-toolbox").getBoundingClientRect().bottom > 40,
    solid: style.backgroundImage !== "none" || style.backgroundColor !== "rgba(0, 0, 0, 0)", shadow: style.boxShadow !== "none" };
}
move(innerWidth / 2, innerHeight / 2);
for (const p of ["sidebar.verticalTabs", "aether.liquidGlass", "aether.compactMode", "aether.compactReveal"]) Services.prefs.clearUserPref(p);
return { ok: out.over.out && out.over.solid && out.over.shadow && out.push.out, ...out };
