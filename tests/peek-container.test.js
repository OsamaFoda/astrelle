// A link peeked from a container tab loads in that container, and "Open in tab" keeps it there,
// so it gets the container's cookies and logins rather than the default ones.
const wait = ms => new Promise(r => setTimeout(r, ms));
Services.prefs.setBoolPref("security.data_uri.block_toplevel_data_uri_navigations", false);
const system = Services.scriptSecurityManager.getSystemPrincipal();
const page = "data:text/html," + encodeURIComponent(
  `<style>a{display:block;height:100vh}</style><a href="data:text/html,<title>target</title>hi">link</a>`);
const tab = gBrowser.addTab(page, { userContextId: 1, triggeringPrincipal: system });
gBrowser.selectedTab = tab;
await wait(1500);
const r = tab.linkedBrowser.getBoundingClientRect();
for (const type of ["mousedown", "mouseup"]) {
  synthesizeMouseEvent(type, r.left + r.width / 2, r.top + r.height / 2,
    { button: 0, clickCount: 1, modifiers: windowUtils.MODIFIER_SHIFT }, { isDOMEventSynthesized: true });
}
await wait(1500);
const peek = document.querySelector("#aether-peek browser");
const out = {
  peeked: peek?.currentURI?.spec,
  peekContainer: peek?.browsingContext?.originAttributes.userContextId,
};
document.querySelector("#aether-peek .aether-peek-button")?.click();
await wait(1500);
const opened = gBrowser.selectedTab;
out.openedURL = opened.linkedBrowser.currentURI.spec;
out.openedContainer = opened.userContextId;
out.openedBrowsingContainer = opened.linkedBrowser.browsingContext.originAttributes.userContextId;
return {
  ok: out.peeked?.includes("target") && out.peekContainer === 1 && opened !== tab &&
    out.openedURL.includes("target") && out.openedContainer === 1 && out.openedBrowsingContainer === 1,
  ...out,
};
