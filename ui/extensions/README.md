Add-ons built into Astrelle, installed into each new profile on first run
(`scripts/install_ui.sh` copies them to `distribution/extensions/`). Each file is named
after the add-on's ID.

- `sip@osamafoda.github.io.xpi`: Sip, the data saver, built from the Sip project with
  `python3 tools/build.py` (its `dist/sip.xpi`). Once addons.mozilla.org has signed a version,
  this is that signed file, at the same version; Astrelle then installs or updates it in existing
  profiles too, and never replaces a newer copy from addons.mozilla.org (`scripts/sip.mjs`).

Sip 0.1 had the id `sip@osama.local`. Astrelle moves its history to the new id on startup, keeps
a backup in `<profile>/sip-migration/`, and uninstalls it once the new one has the history.
