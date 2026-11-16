// timeout: 60
// A Mozilla language pack carries its own branding (brand.ftl saying Firefox, brandings.ftl with
// Firefox's feature names). Installed, its menus say Astrelle anyway (scripts/langpack-brand.mjs),
// and its other strings still work. Here a stand-in Esperanto pack, as Mozilla's are made.
const wait = ms => new Promise(r => setTimeout(r, ms));
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const dir = PathUtils.join(PathUtils.profileDir, "langpack-eo");
const major = Services.appinfo.version.split(".")[0];
const files = {
  "manifest.json": JSON.stringify({
    manifest_version: 2, name: "Language: Esperanto", version: `${Services.appinfo.version}.1`, langpack_id: "eo",
    languages: { eo: { chrome_resources: {}, version: "1" } }, sources: { browser: { base_path: "browser/" } },
    browser_specific_settings: { gecko: { id: "langpack-eo@firefox.mozilla.org", strict_min_version: `${major}.0`, strict_max_version: `${major}.*` } },
  }),
  "browser/localization/eo/branding/brand.ftl": "-brand-short-name = Firefox\n-brand-product-name = Firefox\ntrademarkInfo = Firefox estas marko de Mozilla.\n",
  "browser/localization/eo/browser/astrelle-test.ftl": "astrelle-test = { -brand-short-name } gardas\nplain-test = Saluton\n",
};
const xpi = PathUtils.join(PathUtils.profileDir, "eo.xpi");
const zip = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
zip.open(await IOUtils.getFile(xpi), 0x04 | 0x08 | 0x20);
for (const [name, text] of Object.entries(files)) {
  const path = PathUtils.join(dir, ...name.split("/"));
  await IOUtils.makeDirectory(PathUtils.parent(path), { ignoreExisting: true });
  await IOUtils.writeUTF8(path, text);
  zip.addEntryFile(name, Ci.nsIZipWriter.COMPRESSION_DEFAULT, await IOUtils.getFile(path), false);
}
zip.close();
Services.prefs.setBoolPref("extensions.langpacks.signatures.required", false);
const install = await AddonManager.getInstallForFile(await IOUtils.getFile(xpi));
await new Promise(resolve => { install.addListener({ onInstallEnded: resolve, onInstallFailed: resolve }); install.install(); });
await wait(1000);
const eo = new Localization(["branding/brand.ftl", "browser/astrelle-test.ftl"], false, undefined, ["eo"]);
const [branded, plain, trademark] = await eo.formatValues([{ id: "astrelle-test" }, { id: "plain-test" }, { id: "trademarkInfo" }]);
return { ok: branded === "Astrelle gardas" && plain === "Saluton" && !/Firefox/.test(trademark), branded, plain, trademark };
