// A chosen wallpaper picture that's gone (moved, deleted) or can't be read shows the colour
// theme's wallpaper instead of a blank, as a desktop picture a page can't show does.
const wait = ms => new Promise(r => setTimeout(r, ms));
const broken = PathUtils.join(PathUtils.profileDir, "not-a-picture.jpg");
await IOUtils.write(broken, crypto.getRandomValues(new Uint8Array(4096)));
Services.prefs.setBoolPref("aether.liquidGlass", true);
Services.prefs.setStringPref("aether.background", "wallpaper");
const root = document.documentElement;
const result = {};
for (const [name, path] of [["missing", PathUtils.join(PathUtils.profileDir, "gone.jpg")], ["unreadable", broken]]) {
  Services.prefs.setStringPref("aether.wallpaper", PathUtils.toFileURI(path));
  await wait(3000);
  result[name] = root.getAttribute("aether-wallpaper");
}
Services.prefs.clearUserPref("aether.wallpaper");
return { ok: result.missing === "theme" && result.unreadable === "theme", ...result };
