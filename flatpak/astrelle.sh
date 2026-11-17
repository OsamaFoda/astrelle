#!/bin/sh
# Starts Astrelle in its Flatpak, named after the app, so the desktop matches its windows to its
# icon and entry.
export TMPDIR="$XDG_RUNTIME_DIR/app/$FLATPAK_ID"
exec /app/lib/astrelle/aether --name io.github.osamafoda.Astrelle "$@"
