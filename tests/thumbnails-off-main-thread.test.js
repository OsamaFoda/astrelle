// timeout: 90
// Making wallpaper thumbnails (in the background after a start, or on Settings' first open)
// never stalls the browser: the pictures are decoded on Firefox's image threads, not handed back
// to the main thread. A large photo is made here (4000×3000, noisy so it's a big JPEG).
const wait = ms => new Promise(r => setTimeout(r, ms));
const { thumbnail } = ChromeUtils.importESModule("chrome://aether/content/scripts/thumbnails.mjs");
const canvas = new OffscreenCanvas(4000, 3000);
const context = canvas.getContext("2d");
const noise = context.createImageData(4000, 3000);
crypto.getRandomValues(noise.data.subarray(0, 65536));
for (let i = 65536; i < noise.data.length; i += 65536) noise.data.copyWithin(i, 0, 65536);
context.putImageData(noise, 0, 0);
const path = PathUtils.join(PathUtils.profileDir, "big.jpg");
await IOUtils.write(path, new Uint8Array(await (await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 })).arrayBuffer()));
await wait(500);
let worst = 0, done = false;
(async () => { while (!done) { const s = performance.now(); await wait(0); worst = Math.max(worst, performance.now() - s); } })();
const plain = await thumbnail(PathUtils.toFileURI(path), window);
const frosted = await thumbnail(PathUtils.toFileURI(path), window, { frosted: true });
done = true;
await wait(50);
return { ok: Boolean(plain && frosted) && worst < 60, worstStallMs: Math.round(worst), made: Boolean(plain && frosted) };
