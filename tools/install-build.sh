#!/usr/bin/env bash
# Installs a downloaded Astrelle build in place of the current one, keeping everything you have.
#
#   tools/install-build.sh astrelle-…-linux-x86_64.tar.xz            install it
#   tools/install-build.sh --dry-run astrelle-…-linux-x86_64.tar.xz  say what it would do
#   tools/install-build.sh --rollback                                go back to the one before
#
# The new build goes in exactly the same folder, ~/Applications/astrelle: Firefox ties a profile
# to the folder a browser is installed in, and a new folder would start an empty profile. The
# first build with its own profile folder (~/.config/astrelle) gets your profile copied there. First it
# copies that profile to ~/Backups, and moves the current install aside to astrelle.previous
# (which --rollback puts back). It deletes nothing. Astrelle must be closed; the next start reopens
# your windows and tabs, as Firefox does after updating itself.
set -euo pipefail

APPS="${ASTRELLE_APPS:-$HOME/Applications}"
PROFILES="${ASTRELLE_PROFILES:-$HOME/.config/mozilla/firefox}"
BACKUPS="${ASTRELLE_BACKUPS:-$HOME/Backups}"
INSTALL="$APPS/astrelle"
PREVIOUS="$APPS/astrelle.previous"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)-$$"

DRY=false
if [ "${1:-}" = --dry-run ]; then DRY=true; shift; fi
run() { echo "  $*"; $DRY || "$@"; }
fail() { echo "Stopped: $*" >&2; exit 1; }

# Any program running from the install folder (the browser and each of its processes).
running() {
  local exe
  for exe in /proc/[0-9]*/exe; do
    case "$(readlink "$exe" 2>/dev/null)" in "$INSTALL"/*) return 0 ;; esac
  done
  pgrep -f "^$INSTALL/aether( |$)" >/dev/null 2>&1
}

# The profiles this install uses: the ones whose compatibility.ini last ran it.
profiles() {
  local dir
  for dir in "$PROFILES"/*/; do
    grep -qx "LastPlatformDir=$INSTALL" "$dir/compatibility.ini" 2>/dev/null && echo "${dir%/}"
  done
  return 0
}

if [ "${1:-}" = --rollback ]; then
  running && fail "Astrelle is open. Close it first."
  [ -d "$PREVIOUS" ] || fail "there's no $PREVIOUS to go back to."
  echo "Going back to the previous build:"
  run mv -T "$INSTALL" "$APPS/astrelle.failed-$STAMP"
  run mv -T "$PREVIOUS" "$INSTALL"
  echo "Done. The build you left is in $APPS/astrelle.failed-$STAMP."
  exit 0
fi

TAR="${1:-}"
[ -f "$TAR" ] || fail "give the downloaded astrelle-…-linux-x86_64.tar.xz."
if running; then $DRY && echo "(Astrelle is open: close it before the real run.)" || fail "Astrelle is open. Close it first."; fi
[ -d "$INSTALL" ] || fail "there's no current install at $INSTALL."

echo "Checking the download…"
LISTING="$(tar -tJf "$TAR")" || fail "$TAR isn't a readable .tar.xz (incomplete download?)."
grep -qx "aether/aether" <<< "$LISTING" && grep -qx "aether/application.ini" <<< "$LISTING" \
  || fail "$TAR doesn't look like an Astrelle build."
# A build with a profile folder of its own (application.ini's Profile=, from MOZ_APP_PROFILE) keeps
# its profiles in ~/.config/<that>, not Firefox's ~/.config/mozilla/firefox.
OWN="$(tar -xJOf "$TAR" aether/application.ini | sed -n 's/^Profile=//p' | head -n1 | tr '[:upper:]' '[:lower:]')"
OWN_ROOT=""; [ -n "$OWN" ] && OWN_ROOT="${XDG_CONFIG_HOME:-$HOME/.config}/$OWN"
# Once it has one, that's where the profile in use is (Firefox's folder keeps only the old copy).
[ -n "$OWN_ROOT" ] && [ -e "$OWN_ROOT/profiles.ini" ] && PROFILES="$OWN_ROOT"

mapfile -t USED < <(profiles)
[ "${#USED[@]}" -gt 0 ] || fail "found no profile used by $INSTALL in $PROFILES; not touching anything."
NEED=$(du -sk "${USED[@]}" | awk '{n += $1} END {print n}')
ROOM="$BACKUPS"; [ -d "$ROOM" ] || ROOM="$(dirname "$BACKUPS")"
FREE=$(df -Pk "$ROOM" | awk 'NR == 2 {print $4}')
[ "$FREE" -gt $((NEED * 2)) ] || fail "not enough free space in $BACKUPS for a copy of your profile."

$DRY && echo "Dry run: nothing will change. It would:"
echo "1. Copy your profile to $BACKUPS/astrelle-profile-$STAMP:"
run mkdir -p "$BACKUPS/astrelle-profile-$STAMP"
for profile in "${USED[@]}"; do run cp -a "$profile" "$BACKUPS/astrelle-profile-$STAMP/"; done

echo "2. Unpack the new build beside the current one:"
STAGE="$APPS/.astrelle-new-$STAMP"
run mkdir -p "$STAGE"
run tar -xJf "$TAR" -C "$STAGE"
$DRY || [ -x "$STAGE/aether/aether" ] || fail "the unpacked build has no program; nothing else was changed (see $STAGE)."

echo "3. Swap them, keeping the current one as $PREVIOUS:"
[ -e "$PREVIOUS" ] && run mv -T "$PREVIOUS" "$PREVIOUS-$STAMP"
run mv -T "$INSTALL" "$PREVIOUS"
run mv -T "$STAGE/aether" "$INSTALL"
run rmdir "$STAGE"

echo "4. Link the interface (ui/) into it, live from $REPO:"
run "$REPO/scripts/install_ui.sh" "$INSTALL" --link

# The first build with a profile folder of its own: your profile goes there before it starts, or
# it would start an empty one. Copied (Firefox's folder keeps the old one, for --rollback), with
# its place in the profile list for this install; the disk cache moved, not copied, so the pages
# it holds don't have to download again. A profile folder that's already there is left as it is.
if [ -n "$OWN_ROOT" ] && [ ! -e "$OWN_ROOT/profiles.ini" ]; then
  echo "5. Give Astrelle its own profile folder, $OWN_ROOT (your profile copied there):"
  run mkdir -p "$OWN_ROOT"
  CACHE="${XDG_CACHE_HOME:-$HOME/.cache}"
  MOVED=()
  for profile in "${USED[@]}"; do
    name="$(basename "$profile")"
    run cp -a "$profile" "$OWN_ROOT/$name"
    if [ -d "$CACHE/mozilla/firefox/$name" ]; then
      run mkdir -p "$CACHE/$OWN"
      run mv -T "$CACHE/mozilla/firefox/$name" "$CACHE/$OWN/$name"
    fi
    MOVED+=("$OWN_ROOT/$name")
  done
  # This install's entries (its hash names the install folder, not the profile folder).
  write_lists() {
    local n=0 name hash
    : > "$OWN_ROOT/profiles.ini"; : > "$OWN_ROOT/installs.ini"
    for profile in "${USED[@]}"; do
      name="$(basename "$profile")"
      printf '[Profile%d]\nName=%s\nIsRelative=1\nPath=%s\n%s\n\n' "$n" "${name#*.}" "$name" "$([ "$n" = 0 ] && echo Default=1)" >> "$OWN_ROOT/profiles.ini"
      n=$((n + 1))
      for hash in $(awk -v want="Default=$name" '/^\[/{section=$0} $0==want{gsub(/[][]/,"",section); print section}' "$PROFILES/installs.ini" 2>/dev/null); do
        printf '[Install%s]\nDefault=%s\nLocked=1\n\n' "$hash" "$name" >> "$OWN_ROOT/profiles.ini"
        printf '[%s]\nDefault=%s\nLocked=1\n\n' "$hash" "$name" >> "$OWN_ROOT/installs.ini"
      done
    done
    printf '[General]\nStartWithLastProfile=1\nVersion=2\n' >> "$OWN_ROOT/profiles.ini"
  }
  run write_lists
  USED=("${MOVED[@]}")
fi

# Firefox clears this after the one start it applies to.
resume_once() { echo 'user_pref("browser.sessionstore.resume_session_once", true);' >> "$1/prefs.js"; }
echo "6. Reopen your windows and tabs on the next start:"
for profile in "${USED[@]}"; do run resume_once "$profile"; done

$DRY && exit 0
echo
echo "Installed. Open Astrelle as usual: your tabs, logins and settings should all be there."
echo "If anything is wrong, close it and run: $0 --rollback"

# Each update keeps another build and another profile copy. Nothing is deleted here; past the
# newest two of each, say how much room they take, so they can be removed by hand.
mapfile -t OLD < <(
  ls -1dt "$APPS"/astrelle.previous-* 2>/dev/null | tail -n +3
  ls -1dt "$BACKUPS"/astrelle-profile-* 2>/dev/null | tail -n +3
)
if [ "${#OLD[@]}" -gt 0 ]; then
  echo
  echo "Older copies from earlier updates take $(du -shc "${OLD[@]}" | tail -n1 | cut -f1); delete them when you're sure you won't need them:"
  printf '  %s\n' "${OLD[@]}"
fi
