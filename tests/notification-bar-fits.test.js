// A notification bar in the narrow sidebar, with long words (French) and two buttons, keeps its
// text, buttons and ✕ inside its edges: the buttons wrap onto lines of their own.
const wait = ms => new Promise(r => setTimeout(r, ms));
const box = gBrowser.getNotificationBox();
const bar = await box.appendNotification("aether-test", {
  label: "Les menus et boîtes de dialogue d’Astrelle sont disponibles en français. Les télécharger (moins de 1 Mo) ?",
  priority: box.PRIORITY_INFO_MEDIUM,
}, [{ label: "Télécharger", callback() {} }, { label: "Pas maintenant", callback() {} }]);
await wait(800);
const edge = bar.getBoundingClientRect();
const inside = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= edge.left - 1 && r.right <= edge.right + 1; };
const buttons = [...bar.querySelectorAll("button")];
const close = bar.shadowRoot.querySelector(".close");
const words = bar.shadowRoot.querySelector(".text-content");
return { ok: buttons.length === 2 && buttons.every(inside) && inside(close) && inside(words), barWidth: Math.round(edge.width),
  buttons: buttons.map(inside), close: inside(close), words: inside(words) };
