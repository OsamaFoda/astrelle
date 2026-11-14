// timeout: 30
// A thumbnail worker that never answers, or fails to load, gives up its request (null) instead
// of holding up every thumbnail after it; the next one starts a fresh worker and is made.
// A copy of the module of its own, so its worker is the one these windows hand it.
const { thumbnail } = ChromeUtils.importESModule("chrome://aether/content/scripts/thumbnails.mjs?worker-fails");
const wait = ms => new Promise(r => setTimeout(r, ms));
const within = (promise, ms) => Promise.race([promise, wait(ms).then(() => "still waiting")]);

// A small picture to copy, in the test profile.
const canvas = document.createElement("canvas");
canvas.width = 64; canvas.height = 40;
canvas.getContext("2d").fillRect(0, 0, 64, 40);
const png = new Uint8Array(await (await new Promise(r => canvas.toBlob(r, "image/png"))).arrayBuffer());
const pictures = [];
for (const name of ["a", "b", "c"]) {
  const path = PathUtils.join(PathUtils.profileDir, `worker-fails-${name}.png`);
  await IOUtils.write(path, png);
  pictures.push(PathUtils.toFileURI(path));
}

const made = [];
class Silent extends EventTarget { // loads, takes the message, never answers
  constructor() { super(); made.push(this); }
  postMessage() {}
  terminate() { this.terminated = true; }
}
const silent = { ChromeWorker: Silent, crypto: window.crypto };
const broken = { // a worker whose script isn't there, which fails as it loads
  ChromeWorker: function () { return new window.ChromeWorker("chrome://aether/content/settings/no-such-worker.js"); },
  crypto: window.crypto,
};

const stuck = await within(thumbnail(pictures[0], silent), 25000);
const failed = await within(thumbnail(pictures[1], broken), 10000);
const fine = await within(thumbnail(pictures[2], window), 10000);
const ok = stuck === null && made[0]?.terminated === true && failed === null &&
  typeof fine === "string" && fine.startsWith("file:") && await IOUtils.exists(Services.io.newURI(fine).QueryInterface(Ci.nsIFileURL).file.path);
return { ok, stuck, terminated: made[0]?.terminated, failed, fine };
