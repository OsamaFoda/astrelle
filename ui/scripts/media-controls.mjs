// Media controls in the sidebar, like Zen's: while audio or video plays in another tab (YouTube,
// music), a glass card under the tabs shows what's playing, with play/pause, previous and next
// (when the site offers them), mute, and the way back to its tab. It goes when you're on that tab,
// when the media ends or its tab closes, or with ✕ (until that tab plays again).
//
// It asks Firefox's media controller (the one behind the keyboard's media keys and the desktop's
// media panel): what's playing (the site's track details, or its tab's title and icon), whether
// it's playing, where it is, and which buttons the site supports. Tabs down the side only.

import { tr } from "./l10n.mjs";

const VERTICAL_TABS = "sidebar.verticalTabs";
const CONTROLLER_EVENTS = ["activated", "deactivated", "metadatachange", "playbackstatechange", "positionstatechange", "supportedkeyschange"];

export function init(win) {
  const doc = win.document;
  const { gBrowser } = win;
  const main = doc.querySelector("sidebar-main");
  if (!main) return;

  const html = (tag, className, parent) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    parent?.append(el);
    return el;
  };
  // In the sidebar's slot for the tab list, after it: Firefox's own tab list stays as it is.
  const card = html("div", "aether-media");
  card.setAttribute("slot", "tabstrip");
  card.hidden = true;
  const head = html("div", "aether-media-head", card);
  const art = html("img", "aether-media-art", head);
  art.alt = "";
  const words = html("div", "aether-media-words", head);
  const title = html("div", "aether-media-title", words);
  const artist = html("div", "aether-media-artist", words);
  const close = html("button", "aether-media-button aether-media-close", head);
  const controls = html("div", "aether-media-controls", card);
  const previous = html("button", "aether-media-button aether-media-previous", controls);
  const playPause = html("button", "aether-media-button aether-media-play", controls);
  const next = html("button", "aether-media-button aether-media-next", controls);
  const mute = html("button", "aether-media-button aether-media-mute", controls);
  const track = html("div", "aether-media-track", card);
  const bar = html("div", "aether-media-bar", track);
  main.append(card);

  for (const [button, id] of [[close, "astrelle-media-close"], [previous, "astrelle-media-previous"], [next, "astrelle-media-next"]]) {
    button.title = tr(id);
    button.setAttribute("aria-label", tr(id));
  }

  // Where each tab's media is, as its site last said (sites say so when it starts, seeks or
  // pauses, not all the time): kept for every tab from the start, so the card has it when it
  // comes out later.
  const positions = new WeakMap(); // controller -> { duration, playbackRate, position, at, playing }
  const watched = new WeakSet();
  const watch = tab => {
    const c = controllerOf(tab);
    if (!c || watched.has(c)) return;
    watched.add(c);
    c.addEventListener("positionstatechange", e => {
      positions.set(c, { duration: e.duration, playbackRate: e.playbackRate, position: e.position, at: win.performance.now(), playing: c.isPlaying });
    });
    c.addEventListener("playbackstatechange", () => {
      // Carry the time it played into the position, before it stops or starts again.
      const p = positions.get(c);
      if (!p) return;
      if (p.playing) p.position = Math.min(p.position + ((win.performance.now() - p.at) / 1000) * (p.playbackRate || 1), p.duration);
      p.at = win.performance.now();
      p.playing = c.isPlaying;
    });
  };

  // The tabs that played most recently first, so the card shows the one you last heard.
  let recent = [];
  let shown = null; // the tab the card is for
  let controller = null; // its media controller, listened to
  const dismissed = new WeakSet(); // closed with ✕, until they play again
  const playedNow = tab => {
    recent = [tab, ...recent.filter(t => t !== tab && t.isConnected)];
    dismissed.delete(tab);
  };
  const controllerOf = tab => {
    try {
      return tab.linkedBrowser?.browsingContext?.mediaController ?? null;
    } catch {
      return null;
    }
  };

  for (const tab of gBrowser.tabs) {
    watch(tab);
    if (tab.soundPlaying) playedNow(tab);
  }

  // Which tab, if any: one with media that isn't the tab you're on.
  function choose() {
    if (!Services.prefs.getBoolPref(VERTICAL_TABS, false)) return null;
    return recent.find(tab => tab.isConnected && !tab.selected && !dismissed.has(tab) && controllerOf(tab)?.isActive) ?? null;
  }

  function update() {
    const tab = choose();
    const now = tab && controllerOf(tab);
    if (now !== controller) {
      for (const type of CONTROLLER_EVENTS) controller?.removeEventListener(type, onController);
      controller = now;
      for (const type of CONTROLLER_EVENTS) controller?.addEventListener(type, onController);
    }
    shown = tab;
    card.hidden = !tab;
    if (!tab) return;
    show(tab);
  }

  function show(tab) {
    let details = {};
    try {
      details = controller.getMetadata() ?? {};
    } catch {} // a page with no track details of its own
    let host = "";
    try {
      host = tab.linkedBrowser.currentURI.host.replace(/^www\./, "");
    } catch {}
    title.textContent = details.title || tab.label;
    artist.textContent = details.artist || host;
    card.title = tr("astrelle-media-go-to-tab", { title: title.textContent });
    // The site's picture for it (the largest that's small enough), or the tab's icon. (With no
    // picture of its own, Firefox offers the tab's icon as one: that's drawn as an icon.)
    const icon = tab.getAttribute("image");
    const pictures = (details.artwork ?? []).filter(a => a.src && a.src !== icon && /^(https?|data|blob):/.test(a.src) && !/favicon/i.test(a.src));
    const size = a => Math.max(0, ...String(a.sizes ?? "").split(/\s+/).map(s => parseInt(s, 10) || 0));
    const picture = pictures.filter(a => size(a) <= 256).sort((a, b) => size(b) - size(a))[0] ?? pictures[0];
    const src = picture?.src || icon || "chrome://global/skin/icons/defaultFavicon.svg";
    if (art.getAttribute("src") !== src) art.src = src;
    art.toggleAttribute("icon", !picture);

    const playing = controller.isPlaying;
    playPause.toggleAttribute("playing", playing);
    playPause.title = tr(playing ? "astrelle-media-pause" : "astrelle-media-play");
    playPause.setAttribute("aria-label", playPause.title);
    const keys = controller.supportedKeys ?? [];
    previous.hidden = !keys.includes("previoustrack");
    next.hidden = !keys.includes("nexttrack");
    mute.toggleAttribute("muted", tab.muted);
    mute.title = tr(tab.muted ? "astrelle-media-unmute" : "astrelle-media-mute");
    mute.setAttribute("aria-label", mute.title);
    progress(playing);
  }

  // The thin line along the bottom: where it is now, then (while playing) a steady glide to the
  // end at the media's own pace, so nothing has to run to keep it moving.
  function progress(playing) {
    const position = positions.get(controller);
    if (!position?.duration || !Number.isFinite(position.duration)) {
      track.hidden = true;
      return;
    }
    track.hidden = false;
    const rate = position.playbackRate || 1;
    const elapsed = position.playing ? ((win.performance.now() - position.at) / 1000) * rate : 0;
    const now = Math.min(position.position + elapsed, position.duration);
    bar.style.transition = "none";
    bar.style.width = `${(now / position.duration) * 100}%`;
    if (!playing) return;
    void bar.offsetWidth;
    bar.style.transition = `width ${(position.duration - now) / rate}s linear`;
    bar.style.width = "100%";
  }

  // (After watch()'s own listeners, which were added first: the position is current by now.)
  const onController = () => update();

  playPause.addEventListener("click", () => (controller?.isPlaying ? controller.pause() : controller?.play()));
  previous.addEventListener("click", () => controller?.prevTrack());
  next.addEventListener("click", () => controller?.nextTrack());
  mute.addEventListener("click", () => {
    shown?.toggleMuteAudio();
    update();
  });
  close.addEventListener("click", () => {
    if (shown) dismissed.add(shown);
    update();
  });
  // The picture and the words take you to its tab.
  for (const part of [art, words]) {
    part.addEventListener("click", () => {
      if (shown) gBrowser.selectedTab = shown;
    });
  }

  const tabs = gBrowser.tabContainer;
  tabs.addEventListener("TabAttrModified", event => {
    const changed = event.detail?.changed ?? [];
    if (changed.includes("soundplaying") && event.target.soundPlaying) playedNow(event.target);
    if (changed.some(name => ["soundplaying", "muted", "label", "image", "activemedia-blocked"].includes(name))) update();
  });
  tabs.addEventListener("TabSelect", update);
  tabs.addEventListener("TabOpen", event => watch(event.target));
  tabs.addEventListener("TabClose", event => {
    recent = recent.filter(t => t !== event.target);
    win.setTimeout(update, 0);
  });
  // A tab's page can move to another process (a new controller): ask again when it navigates.
  gBrowser.addTabsProgressListener({
    onLocationChange: browser => {
      const tab = gBrowser.getTabForBrowser(browser);
      if (tab) watch(tab);
      if (recent.includes(tab)) win.setTimeout(update, 0);
    },
  });
  Services.prefs.addObserver(VERTICAL_TABS, update);
  win.addEventListener("unload", () => Services.prefs.removeObserver(VERTICAL_TABS, update), { once: true });
  update();
  win.aetherMedia = { update, get tab() { return shown; } };
}
