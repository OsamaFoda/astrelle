// timeout: 60
// Media controls in the sidebar: while a tab you're not on plays (a local tone, with the site's
// track details, previous/next and position, as music sites give), the card shows it, and its
// buttons reach the page: pause, play, next, mute; its words go to the tab (where it hides); ✕
// hides it. The progress line shows where it is. (Output volume is zero: nothing is heard.)
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setIntPref("media.autoplay.default", 0);
Services.prefs.setIntPref("media.autoplay.blocking_policy", 0);
Services.prefs.setStringPref("media.volume_scale", "0.0");
// A 60 s tone (a WAV) and a page that plays it and describes it, as a music site does.
const dir = PathUtils.join(PathUtils.profileDir, "media-test");
await IOUtils.makeDirectory(dir, { ignoreExisting: true });
const rate = 8000, seconds = 60, samples = rate * seconds;
const wav = new DataView(new ArrayBuffer(44 + samples * 2));
const text = (o, s) => [...s].forEach((c, i) => wav.setUint8(o + i, c.charCodeAt(0)));
text(0, "RIFF"); wav.setUint32(4, 36 + samples * 2, true); text(8, "WAVEfmt "); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true);
wav.setUint16(22, 1, true); wav.setUint32(24, rate, true); wav.setUint32(28, rate * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true);
text(36, "data"); wav.setUint32(40, samples * 2, true);
for (let i = 0; i < samples; i++) wav.setInt16(44 + i * 2, Math.round(Math.sin(i * 2 * Math.PI * 440 / rate) * 8000), true);
await IOUtils.write(PathUtils.join(dir, "tone.wav"), new Uint8Array(wav.buffer));
await IOUtils.writeUTF8(PathUtils.join(dir, "song.html"), `<!doctype html><title>Song page</title><audio id=a src="tone.wav" autoplay loop></audio><script>
  navigator.mediaSession.metadata = new MediaMetadata({ title: "Test Song", artist: "Test Artist" });
  navigator.mediaSession.setActionHandler("nexttrack", () => document.title = "next pressed");
  navigator.mediaSession.setActionHandler("previoustrack", () => document.title = "previous pressed");
  document.getElementById("a").addEventListener("playing", () => navigator.mediaSession.setPositionState({ duration: 60, position: 21, playbackRate: 1 }));
</script>`);
const song = gBrowser.selectedTab = gBrowser.addTrustedTab(PathUtils.toFileURI(PathUtils.join(dir, "song.html")));
await wait(3000);
const other = gBrowser.selectedTab = gBrowser.addTrustedTab("about:robots");
await wait(1500);
const card = document.querySelector(".aether-media");
const q = s => card.querySelector(s);
const out = {
  soundPlaying: song.soundPlaying, active: song.linkedBrowser.browsingContext.mediaController.isActive,
  shown: !card.hidden, title: q(".aether-media-title").textContent, artist: q(".aether-media-artist").textContent,
  prev: !q(".aether-media-previous").hidden, next: !q(".aether-media-next").hidden, playing: q(".aether-media-play").hasAttribute("playing"),
  progress: !q(".aether-media-track").hidden,
};
q(".aether-media-play").click(); await wait(1000);
out.pausedByCard = !song.linkedBrowser.browsingContext.mediaController.isPlaying && !q(".aether-media-play").hasAttribute("playing");
q(".aether-media-play").click(); await wait(1000);
out.playingAgain = song.linkedBrowser.browsingContext.mediaController.isPlaying;
q(".aether-media-next").click(); await wait(800);
out.nextReachedPage = song.linkedBrowser.contentTitle;
q(".aether-media-mute").click(); await wait(500);
out.muted = song.muted && q(".aether-media-mute").hasAttribute("muted");
q(".aether-media-mute").click(); await wait(300);
q(".aether-media-title").click(); await wait(800);
out.wentToTab = gBrowser.selectedTab === song && card.hidden;
gBrowser.selectedTab = other; await wait(800);
out.backWhenAway = !card.hidden;
q(".aether-media-close").click(); await wait(300);
out.closed = card.hidden;
const ok = out.soundPlaying && out.shown && out.title === "Test Song" && out.artist === "Test Artist" && out.prev && out.next && out.playing && out.progress
  && out.pausedByCard && out.playingAgain && out.nextReachedPage === "next pressed" && out.muted && out.wentToTab && out.backWhenAway && out.closed;
return { ok, ...out };
