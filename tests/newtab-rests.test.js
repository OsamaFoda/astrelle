// timeout: 45
// The New Tab page, drawing the window's wallpaper, follows where the window is only while
// something may be moving it: once all is still it asks for no frames at all (each one keeps the
// whole window busy), and it starts again when the window is resized or something in it slides.
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.setStringPref("aether.background", "wallpaper");
BrowserCommands.openTab();
await wait(2500);
const page = gBrowser.selectedBrowser.contentWindow;
let frames = 0;
const ask = page.requestAnimationFrame.bind(page);
page.requestAnimationFrame = callback => { frames++; return ask(callback); };
await wait(1500);
const out = { wallpaper: page.document.documentElement.hasAttribute("aether-wallpaper") };
frames = 0;
await wait(1000);
out.restingFrames = frames;
// Compact mode slides the page: it follows again, then rests again.
frames = 0;
Services.prefs.setBoolPref("aether.compactMode", true);
await wait(600);
out.slidingFrames = frames;
await wait(2000);
frames = 0;
await wait(1000);
out.restingAgain = frames;
for (const p of ["aether.liquidGlass", "aether.background", "aether.compactMode"]) Services.prefs.clearUserPref(p);
return { ok: out.wallpaper && out.restingFrames === 0 && out.slidingFrames > 5 && out.restingAgain === 0, ...out };
