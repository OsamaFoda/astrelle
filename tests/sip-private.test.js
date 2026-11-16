// timeout: 45
// Turning Sip on lets it count private windows (as one total, with no site names).
const { setSip } = ChromeUtils.importESModule("chrome://aether/content/scripts/choices.mjs");
const { SIP_ID } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
await setSip(true);
await new Promise(r => setTimeout(r, 1500));
const policy = WebExtensionPolicy.getByID(SIP_ID);
return { ok: policy?.privateBrowsingAllowed === true, allowed: policy?.privateBrowsingAllowed };
