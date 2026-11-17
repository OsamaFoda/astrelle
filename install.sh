#!/usr/bin/env bash
# Installs Astrelle for you alone (no administrator password), or updates it to the newest release.
#
#   curl -fsSL https://raw.githubusercontent.com/OsamaFoda/astrelle/main/install.sh | bash
#
#   install.sh                       install, or update to the newest release
#   install.sh FILE.tar.xz           install, or update from a release already downloaded
#   install.sh --uninstall           remove it (your bookmarks, history and settings stay)
#
# Astrelle goes in ~/.local/share/astrelle/app, always the same folder, as your profile is tied to
# the folder a browser runs from. You get a launcher in your app list, and the `astrelle` command if
# ~/.local/bin is on your PATH. Run it again any time to update: it downloads only when there's a
# newer release (about 90 MB), and changes nothing while Astrelle is open.
#
# Astrelle runs its own copy (in its folder) with --while-open when you choose Update: the new build
# is swapped in while it's open, as a distribution's updates are, and takes over when it restarts.
set -euo pipefail

main() {
  local repo="OsamaFoda/astrelle"
  local data="${XDG_DATA_HOME:-$HOME/.local/share}"
  local home="$data/astrelle"
  local app="$home/app"
  local launcher="$data/applications/aether.desktop" # the name Astrelle looks for to set its icon
  local command="$HOME/.local/bin/astrelle"
  local profile="${XDG_CONFIG_HOME:-$HOME/.config}/astrelle"

  say() { printf '%s\n' "$*"; }
  fail() { printf 'Stopped: %s\n' "$*" >&2; exit 1; }
  # The release installed: builds name theirs; older ones were named by this.
  installed() { cat "$app/astrelle-release" 2>/dev/null || cat "$home/release" 2>/dev/null || true; }

  local while_open=false
  if [ "${1:-}" = --while-open ]; then while_open=true; shift; fi

  # Any program running from the install folder: the browser and each of its processes.
  running() {
    local exe
    for exe in /proc/[0-9]*/exe; do
      case "$(readlink "$exe" 2>/dev/null)" in "$app"/*) return 0 ;; esac
    done
    return 1
  }

  # A launcher this didn't make, for an Astrelle installed somewhere else, is left alone.
  ours() {
    [ ! -e "$launcher" ] || grep -qF "Exec=\"$app/aether\" " "$launcher"
  }

  if [ "${1:-}" = --uninstall ]; then
    [ -d "$app" ] || fail "Astrelle isn't installed in $app."
    running && fail "Astrelle is open. Close it first."
    ours && rm -f "$launcher"
    [ -L "$command" ] && [ "$(readlink "$command")" = "$app/aether" ] && rm -f "$command"
    rm -rf "$app" "$home/release"
    rmdir "$home" 2>/dev/null || true
    command -v update-desktop-database >/dev/null && update-desktop-database -q "$data/applications" || true
    say "Astrelle is uninstalled. Your bookmarks, history and settings are still in $profile;"
    say "delete that folder too if you won't be back."
    exit 0
  fi

  [ "$(uname -s)" = Linux ] && [ "$(uname -m)" = x86_64 ] || fail "Astrelle is built for 64-bit Intel and AMD Linux only, for now."
  local tool
  for tool in tar xz; do command -v "$tool" >/dev/null || fail "this needs $tool; install it from your distribution first."; done
  ours || fail "$launcher starts an Astrelle installed somewhere else; this leaves it alone. Remove that one, or its launcher, first."
  if ! $while_open && running; then fail "Astrelle is open. Close it, then run this again."; fi

  local work
  work="$(mktemp -d)"
  trap "rm -rf '$work'" EXIT
  local tarball release

  if [ -n "${1:-}" ]; then
    tarball="$1"
    [ -f "$tarball" ] || fail "there's no file $tarball."
    release="$(basename "$tarball" -linux-x86_64.tar.xz)"
    release="${release#aether-}"
  else
    command -v curl >/dev/null || fail "this needs curl; install it from your distribution first."
    say "Looking for the newest Astrelle…"
    local info url
    info="$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest")" || fail "couldn't reach GitHub. Are you online?"
    release="$(printf '%s' "$info" | grep -o '"tag_name": *"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"
    url="$(printf '%s' "$info" | grep -o '"browser_download_url": *"[^"]*-linux-x86_64\.tar\.xz"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"
    [ -n "$release" ] && [ -n "$url" ] || fail "the newest release has no Linux download."
    if [ -d "$app" ] && [ "$(installed)" = "$release" ]; then
      say "Astrelle is up to date ($release)."
      exit 0
    fi
    say "Downloading Astrelle $release (about 90 MB)…"
    tarball="$work/astrelle.tar.xz"
    curl -fL --progress-bar "$url" -o "$tarball" || fail "the download didn't finish. Run this again to retry."
    # Checked against the release's published checksum, where it has one.
    if curl -fsSL "$url.sha256" -o "$work/sum" 2>/dev/null; then
      [ "$(cut -d' ' -f1 "$work/sum")" = "$(sha256sum "$tarball" | cut -d' ' -f1)" ] \
        || fail "the download doesn't match its checksum (damaged on the way?). Run this again."
    fi
  fi

  say "Unpacking…"
  mkdir -p "$home"
  tar -xJf "$tarball" -C "$work" || fail "$tarball isn't a complete Astrelle download."
  [ -x "$work/aether/aether" ] && [ -f "$work/aether/application.ini" ] || fail "$tarball doesn't look like an Astrelle build."
  [ -f "$work/aether/astrelle-release" ] && release="$(cat "$work/aether/astrelle-release")"
  # Swapped in whole, in the same folder; the build it replaces goes once the new one is in place.
  rm -rf "$home/app.new" "$home/app.old"
  mv "$work/aether" "$home/app.new"
  [ -d "$app" ] && mv "$app" "$home/app.old"
  mv "$home/app.new" "$app"
  rm -rf "$home/app.old"
  printf '%s\n' "$release" > "$home/release"

  # The launcher. The icon you chose in Astrelle is kept (it sets that itself as it starts).
  local icon="$app/browser/chrome/icons/default/default128.png"
  if [ -e "$launcher" ]; then
    local kept
    kept="$(sed -n 's/^Icon=//p' "$launcher" | head -n1)"
    [ -f "$kept" ] && icon="$kept"
  fi
  mkdir -p "$(dirname "$launcher")"
  cat > "$launcher" <<EOF
[Desktop Entry]
Type=Application
Name=Astrelle
GenericName=Web Browser
Comment=A calm, fast browser that's light on your data
Exec="$app/aether" %u
Icon=$icon
Terminal=false
Categories=Network;WebBrowser;
Keywords=web;browser;internet;
MimeType=text/html;text/xml;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;
StartupNotify=true
StartupWMClass=aether-default
Actions=new-window;new-private-window;

[Desktop Action new-window]
Name=New Window
Exec="$app/aether" --new-window %u

[Desktop Action new-private-window]
Name=New Private Window
Exec="$app/aether" --private-window %u
EOF
  command -v update-desktop-database >/dev/null && update-desktop-database -q "$data/applications" || true

  mkdir -p "$(dirname "$command")"
  # The command, unless there's already one of that name that isn't this.
  [ -e "$command" ] || [ -L "$command" ] || ln -s "$app/aether" "$command"

  say "Astrelle $release is installed. Open it from your app list."
  case ":$PATH:" in
    *":$HOME/.local/bin:"*) [ "$(readlink "$command")" = "$app/aether" ] && say "Or type: astrelle" ;;
  esac
  say "To update later, run this again."
}

# All of it read before any of it runs, so a download cut short does nothing.
main "$@"
