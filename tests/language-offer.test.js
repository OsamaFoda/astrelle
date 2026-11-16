// timeout: 60
// When the system's language has no Firefox strings here, Astrelle offers Mozilla's language pack
// once, installs it from the archive on Download (here a local stand-in), and asks to restart.
const { offerLanguage, hasFirefoxStrings, installLanguage } = ChromeUtils.importESModule("chrome://aether/content/scripts/languages.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
// A stand-in language pack, as Mozilla's archive serves them.
const dir = PathUtils.join(PathUtils.profileDir, "langpack-eo");
await IOUtils.writeJSON(PathUtils.join(dir, "manifest.json"), {
  manifest_version: 2, name: "Language: Esperanto", version: `${Services.appinfo.version}.1`, langpack_id: "eo",
  languages: { eo: { chrome_resources: {}, version: "1" } }, sources: { browser: { base_path: "browser/" } },
  browser_specific_settings: { gecko: { id: "langpack-eo@firefox.mozilla.org", strict_min_version: Services.appinfo.version.split(".")[0] + ".0", strict_max_version: Services.appinfo.version.split(".")[0] + ".*" } },
});
await IOUtils.makeDirectory(PathUtils.join(dir, "browser"), { ignoreExisting: true });
const xpi = PathUtils.join(PathUtils.profileDir, "eo.xpi");
const zip = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
zip.open(await IOUtils.getFile(xpi), 0x04 | 0x08 | 0x20);
zip.addEntryFile("manifest.json", Ci.nsIZipWriter.COMPRESSION_DEFAULT, await IOUtils.getFile(PathUtils.join(dir, "manifest.json")), false);
zip.close();
Services.prefs.setBoolPref("extensions.langpacks.signatures.required", false);
Services.prefs.setStringPref("aether.languages.packURL", Services.io.newFileURI(await IOUtils.getFile(xpi)).spec.replace("eo.xpi", "{locale}.xpi"));
Services.prefs.setStringPref("intl.locale.requested", "eo");
const offered = await offerLanguage(window);
const bar = gBrowser.getNotificationBox().getNotificationWithValue("aether-language");
const text = bar?.messageText?.textContent ?? bar?.label ?? "";
const logged = [];
const listener = { observe: message => { if (/langpack|language pack|Esperanto|AddonManager|XPIInstall|xpi/i.test(message.message ?? message.errorMessage ?? "")) logged.push(String(message.message ?? message.errorMessage).replace(/^.*?: \[Exception/, "[Exception").slice(0, 600)); } };
Services.console.registerListener(listener);
(bar?.buttonContainer?.querySelector("button") ?? bar?.querySelector("button"))?.click(); // once: click() returns nothing
let installed = false;
for (let i = 0; i < 80 && !installed; i++) { // up to 20 s: slower machines (CI) take longer
  await wait(250);
  installed = await hasFirefoxStrings("eo");
}
await wait(500);
const restart = !!gBrowser.getNotificationBox().getNotificationWithValue("aether-language-restart");
Services.console.unregisterListener(listener);
// When it didn't install, why: the failure bar, and the error from installing it again directly.
let why = null;
if (!installed) {
  why = { failedBar: !!gBrowser.getNotificationBox().getNotificationWithValue("aether-language-failed"), logged };
  try { await installLanguage("eo"); why.again = await hasFirefoxStrings("eo"); } catch (e) { why.error = String(e?.message ?? e); }
}
Services.prefs.clearUserPref("intl.locale.requested");
return { ok: offered && installed && restart && /Esperanto|esperanto/.test(text), offered, installed, restart, text, why };
