// timeout: 45
// While Sip's autoplay saver is on, the browser's own autoplay and preloading follow it, YouTube
// may still play; switched off in Sip, Firefox's defaults come back within a second.
const { setSip } = ChromeUtils.importESModule("chrome://aether/content/scripts/choices.mjs");
const { sipSet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const youtube = () => Services.perms.testPermissionFromPrincipal(
  Services.scriptSecurityManager.createContentPrincipalFromOrigin("https://www.youtube.com"), "autoplay-media");
await setSip(true);
await wait(1500);
const on = { autoplay: Services.prefs.getIntPref("media.autoplay.default"), preload: Services.prefs.getIntPref("media.preload.default"),
  auto: Services.prefs.getIntPref("media.preload.auto"), youtube: youtube() };
await sipSet({ "opt.autoplay": false });
await wait(1000);
const off = { autoplayDefault: !Services.prefs.prefHasUserValue("media.autoplay.default"), youtube: youtube() };
return {
  ok: on.autoplay === 5 && on.preload === 1 && on.auto === 1 && on.youtube === Services.perms.ALLOW_ACTION
    && off.autoplayDefault && off.youtube === Services.perms.UNKNOWN_ACTION,
  on, off,
};
