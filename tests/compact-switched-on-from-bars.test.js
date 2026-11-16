// Compact mode switched on with the mouse on the bars (its own button) hides them at once, rather
// than leaving them out until the mouse moves off; touching the edge afterwards brings them back.
// With tabs on top and down the side.
const wait = ms => new Promise(r => setTimeout(r, ms));
const move = (x, y) => synthesizeMouseEvent("mousemove", x, y, {}, { isDOMEventSynthesized: true });
const out = {};
for (const vertical of [false, true]) {
  Services.prefs.setBoolPref("sidebar.verticalTabs", vertical);
  Services.prefs.setBoolPref("aether.compactMode", false);
  await wait(1500);
  const bar = document.getElementById(vertical ? "sidebar-container" : "navigator-toolbox");
  const button = document.getElementById("aether-compact-mode").getBoundingClientRect();
  move(button.left + button.width / 2, button.top + button.height / 2);
  await wait(200);
  const onBar = ["sidebar-container", "navigator-toolbox"].some(id => document.getElementById(id).matches(":hover"));
  Services.prefs.setBoolPref("aether.compactMode", true);
  await wait(1500);
  const gone = r => vertical ? r.right <= 0 : r.bottom <= 0;
  const hidden = gone(bar.getBoundingClientRect());
  move(innerWidth / 2, innerHeight / 2);
  await wait(300);
  move(vertical ? 2 : innerWidth / 2, vertical ? innerHeight / 2 : 2);
  await wait(1200);
  const back = !gone(bar.getBoundingClientRect());
  move(innerWidth / 2, innerHeight / 2);
  await wait(300);
  out[vertical ? "sidebar" : "top"] = { onBar, hidden, back };
}
Services.prefs.clearUserPref("aether.compactMode");
Services.prefs.clearUserPref("sidebar.verticalTabs");
return { ok: Object.values(out).every(r => r.onBar && r.hidden && r.back), ...out };
