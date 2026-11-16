// When Astrelle installs its bundled Sip: for a new profile or to replace the old id, to update an
// older copy, and to swap an unsigned copy for the signed one at the same version; never to bring
// back a Sip the person removed, nor to replace a newer copy from addons.mozilla.org.
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { shouldInstallBundled } = ChromeUtils.importESModule("chrome://aether/content/scripts/sip.mjs");
const unsigned = AddonManager.SIGNEDSTATE_MISSING;
const signed = AddonManager.SIGNEDSTATE_SIGNED;
const bundled = (version, signedState = unsigned) => ({ version, signedState });
const cases = [
  ["replaces the old id", { installed: null, old: {}, welcomePending: false, bundled: bundled("1.0.0") }, true],
  ["a new profile gets it", { installed: null, old: null, welcomePending: true, bundled: bundled("1.0.0") }, true],
  ["one the person removed stays removed", { installed: null, old: null, welcomePending: false, bundled: bundled("1.0.0") }, false],
  ["an older copy is updated", { installed: bundled("0.9.0", signed), bundled: bundled("1.0.0") }, true],
  ["a newer copy is left alone", { installed: bundled("1.1.0", signed), bundled: bundled("1.0.0", signed) }, false],
  ["unsigned to signed at the same version", { installed: bundled("1.0.0"), bundled: bundled("1.0.0", signed) }, true],
  ["both unsigned: nothing to do", { installed: bundled("1.0.0"), bundled: bundled("1.0.0") }, false],
  ["already signed: nothing to do", { installed: bundled("1.0.0", signed), bundled: bundled("1.0.0", signed) }, false],
];
const wrong = cases.filter(([, input, want]) => shouldInstallBundled(input) !== want).map(([name]) => name);
return { ok: !wrong.length, wrong };
