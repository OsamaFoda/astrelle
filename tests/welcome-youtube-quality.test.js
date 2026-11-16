// timeout: 45
// The welcome's Sip step asks for the highest YouTube quality (480p to start), and turning Sip
// on saves the choice into Sip's storage.
const { sipGet } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const wait = ms => new Promise(r => setTimeout(r, ms));
const tab = gBrowser.addTrustedTab("chrome://aether/content/welcome/welcome.html");
gBrowser.selectedTab = tab;
await wait(2000);
const doc = tab.linkedBrowser.contentDocument;
const offered = doc.getElementById("youtube-quality")?.value;
const labels = [...doc.getElementById("youtube-quality").options].map(o => o.textContent);
doc.getElementById("youtube-quality").value = "360";
doc.getElementById("sip-on").click();
await wait(3000);
const saved = (await sipGet(["opt.youtube"]))["opt.youtube"];
return { ok: offered === "480" && saved === 360 && labels.includes("720p (HD)") && labels.includes("1080p (Full HD)"), offered, saved, labels };
