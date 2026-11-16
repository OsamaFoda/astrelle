// Notification bars ("Pop-up blocked", "Save password?", Astrelle's offer of a language) sit with
// the toolbar, which in the sidebar layout is the narrow sidebar. Firefox lays a bar's buttons out
// on one line, which then sets its width: with longer text or buttons (French "Pas maintenant")
// the words ran past the sidebar's edge and its ✕ was out of sight. Inside each bar as it appears
// (Firefox draws it in a shadow tree, where the page's styles don't reach), the buttons wrap onto
// lines of their own and the words take only the room there is.

const RULES = `
  .content { min-width: 0; }
  .text-container, .text-content { min-width: 0; overflow-wrap: anywhere; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; max-width: 100%; }
`;

export function init(win) {
  const sheet = new win.CSSStyleSheet();
  sheet.replaceSync(RULES);
  const fit = bar => {
    const root = bar?.shadowRoot;
    if (root && !root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  };
  // Every bar announces itself as it shows (AlertActive), wherever it is.
  win.addEventListener("AlertActive", event => {
    if (event.target.localName === "notification-message") fit(event.target);
  }, true);
  for (const bar of win.document.querySelectorAll("notification-message")) fit(bar);
}
