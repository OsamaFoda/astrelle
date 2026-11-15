// Link prefetching and Pocket's story feeds, which cost data in the background, are off.
const P = Services.prefs;
const seen = {
  prefetch: P.getBoolPref("network.prefetch-next"),
  pocket: P.getBoolPref("extensions.pocket.enabled"),
  stories: P.getBoolPref("browser.newtabpage.activity-stream.feeds.section.topstories"),
  storyFeed: P.getBoolPref("browser.newtabpage.activity-stream.feeds.system.topstories"),
};
return { ok: !seen.prefetch && !seen.pocket && !seen.stories && !seen.storyFeed, ...seen };
