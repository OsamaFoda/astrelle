// With many workspaces (one with a long name), every one of them and "+" can be seen: in the
// sidebar they wrap onto rows of their own; on a narrow top toolbar the one you're in is
// scrolled into view.
const wait = ms => new Promise(r => setTimeout(r, ms));
const names = ["Main", "Study", "Work", "A very long workspace name indeed", "Reading", "Travel", "Games", "News"];
Services.prefs.setStringPref("aether.workspaces", JSON.stringify(names.map((name, i) => ({ id: i ? `w${i}` : "home", name }))));
await wait(300);
window.aetherWorkspaces.switchTo("w7");
await wait(600);
const item = document.getElementById("aether-workspaces");
const inside = (el, box) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= box.left - 1 && r.right <= box.right + 1; };
const sidebarBox = document.getElementById("nav-bar").getBoundingClientRect();
const allInSidebar = [...item.children].every(el => inside(el, sidebarBox));

Services.prefs.setBoolPref("sidebar.verticalTabs", false);
await wait(1500);
window.resizeTo(700, 600);
await wait(800);
window.aetherWorkspaces.switchTo("home");
await wait(300);
window.aetherWorkspaces.switchTo("w7");
await wait(600);
const top = document.getElementById("aether-workspaces");
const activeInView = inside(top.querySelector("[active]"), top.getBoundingClientRect());
Services.prefs.clearUserPref("sidebar.verticalTabs");
return { ok: allInSidebar && activeInView, allInSidebar, activeInView };
