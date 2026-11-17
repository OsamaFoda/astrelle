// timeout: 60
// A newer release on GitHub (here a local stand-in) brings a bar. Installed some other way, its
// Download opens the Releases page; Not now keeps it away for that release. Installed with
// install.sh, Update runs that installer (here a stand-in) with --while-open, then asks for a
// restart, or says it couldn't. The same or an older release, or one it can't read, brings none.
const { check, isNewer } = ChromeUtils.importESModule("chrome://aether/content/scripts/updates.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const box = gBrowser.getNotificationBox();
const bar = value => box.getNotificationWithValue(value);
const buttons = value => [...(bar(value)?.buttonContainer?.querySelectorAll("button") ?? [])];
const latest = tag => Services.prefs.setStringPref("aether.updates.url", "data:application/json," + encodeURIComponent(JSON.stringify({ tag_name: tag })));
const out = {};
out.order = [
  isNewer("v153.8.0esr-1", "v153.7.0esr-3"), isNewer("v153.7.0esr-3", "v153.7.0esr-2"), !isNewer("v153.7.0esr-2", "v153.7.0esr-2"),
  !isNewer("v153.7.0esr-1", "v153.7.0esr-2"), isNewer("v160.0esr-1", "v153.7.0esr-9"), !isNewer("nonsense", "v153.7.0esr-1"),
].every(Boolean);

Services.prefs.setStringPref("aether.updates.current", "v153.7.0esr-2");
Services.prefs.setStringPref("aether.updates.page", "about:blank#releases");
Services.prefs.setStringPref("aether.updates.installer", PathUtils.join(PathUtils.profileDir, "none.sh"));
latest("v153.7.0esr-2");
out.sameNone = !(await check(window)) && !bar("aether-update");
latest("v153.8.0esr-1");
out.newerOffered = await check(window) && !!bar("aether-update");
out.labels = buttons("aether-update").map(b => b.label ?? b.textContent);
const tabs = gBrowser.tabs.length;
buttons("aether-update")[0].click();
await wait(500);
out.download = gBrowser.tabs.length === tabs + 1 && gBrowser.tabs.at(-1).linkedBrowser.currentURI.spec === "about:blank#releases";
gBrowser.removeTab(gBrowser.tabs.at(-1));
await check(window);
buttons("aether-update")[1].click();
await wait(300);
out.notNowKeptAway = !(await check(window)) && !bar("aether-update");
latest("v153.8.0esr-2");
out.nextReleaseOffered = await check(window);
bar("aether-update")?.close();

// Installed with install.sh: Update runs it, while open.
const installer = PathUtils.join(PathUtils.profileDir, "install.sh");
const ran = PathUtils.join(PathUtils.profileDir, "ran");
const tryUpdate = async exit => {
  await IOUtils.writeUTF8(installer, `echo "$@" > "${ran}"\nsleep 1\nexit ${exit}\n`);
  Services.prefs.setStringPref("aether.updates.installer", installer);
  await check(window);
  const label = buttons("aether-update")[0]?.label;
  buttons("aether-update")[0].click();
  await wait(300);
  const working = !!bar("aether-update-working");
  for (let i = 0; i < 40 && bar("aether-update-working"); i++) await wait(250);
  const seen = { label, working, args: (await IOUtils.readUTF8(ran)).trim(), restart: !!bar("aether-update-restart"), failed: !!bar("aether-update-failed") };
  for (const v of ["aether-update-restart", "aether-update-failed"]) bar(v)?.close();
  return seen;
};
latest("v153.8.0esr-3");
out.updated = await tryUpdate(0);
latest("v153.8.0esr-4");
out.failed = await tryUpdate(1);

for (const p of ["aether.updates.current", "aether.updates.page", "aether.updates.installer", "aether.updates.url", "aether.updates.declined"]) Services.prefs.clearUserPref(p);
const ok = out.order && out.sameNone && out.newerOffered && out.labels.join() === "Download,Not now" && out.download && out.notNowKeptAway
  && out.nextReleaseOffered && out.updated.label === "Update" && out.updated.working && out.updated.args === "--while-open"
  && out.updated.restart && !out.updated.failed && out.failed.failed && !out.failed.restart;
return { ok, ...out };
