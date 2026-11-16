# Astrelle: the browser window (sidebar, menus, buttons). English is the source.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Frosted Glass
astrelle-compact-mode = Compact Mode
astrelle-compact-mode-tooltip = Compact Mode: hide the sidebar until the mouse reaches the edge (Ctrl+Alt+C)
astrelle-compact-mode-item = Compact mode
astrelle-compact-mode-description = Hide the sidebar until the mouse reaches the edge of the window (Ctrl+Alt+C)
astrelle-manage-settings = Manage Astrelle settings
astrelle-new-private-window-tooltip = New private window (Ctrl+Shift+P)
astrelle-settings-menu = Astrelle Settings…
astrelle-settings = Astrelle Settings
astrelle-split-view = Split View
astrelle-split-view-tooltip = Split View: show two tabs side by side (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Open in tab
astrelle-peek-close = Close (Esc)

## Workspaces

astrelle-workspaces = Workspaces
astrelle-workspace-new-title = New workspace
astrelle-workspace-new-prompt = Name for the new workspace:
astrelle-workspace-rename-title = Rename workspace
astrelle-workspace-rename-prompt = New name:
astrelle-workspace-delete-title = Delete workspace
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] Delete "{ $name }"? It has no tabs to move.
        [one] Delete "{ $name }"? Its { $tabs } tab will move to "{ $heir }".
       *[other] Delete "{ $name }"? Its { $tabs } tabs will move to "{ $heir }".
    }
astrelle-workspace-button-title = { $name } (right-click to rename or delete)
astrelle-workspace-add-title = New workspace: a separate set of tabs to switch to, like Study or Work
astrelle-workspace-add = New workspace
astrelle-workspace-rename = Rename…
astrelle-workspace-delete = Delete…
astrelle-move-to-workspace = Move to Workspace

## New Tab

astrelle-newtab-pin = Pin
astrelle-newtab-unpin = Unpin

## Welcome and Settings

astrelle-addon-downloading = Downloading and turning on…
astrelle-protection-on = Protection is on ✓
astrelle-protection-off = Protection is off
astrelle-turning-on = Turning on…
astrelle-turning-off = Turning off…
astrelle-download-failed = Couldn't download it. Check your connection and try again.
astrelle-download-failed-skip = Couldn't download it. Check your connection and try again, or skip for now.
astrelle-welcome-done-both = Protection and Sip are on. You can change this any time in Astrelle Settings.
astrelle-welcome-done-protection = Protection is on. You can change this any time in Astrelle Settings.
astrelle-welcome-done-sip = Sip is on. You can change this any time in Astrelle Settings.
astrelle-welcome-done-none = You can turn on protection or Sip any time in Astrelle Settings.
astrelle-choose-wallpaper = Choose a wallpaper
astrelle-wallpaper-theme = Your theme
astrelle-wallpaper-desktop = Your desktop
astrelle-choose-picture = Choose a picture…
astrelle-sip-used-saved = Sip counts on from there ✓
astrelle-sip-used-invalid = Enter what your carrier says you've used, in GB.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Astrelle's menus and dialogs are available in { $language }. Download them (under 1 MB)?
astrelle-language-download = Download
astrelle-language-not-now = Not now
astrelle-language-restart-to = Restart Astrelle to finish switching to { $language }.
astrelle-language-restart = Restart
astrelle-language-failed = Couldn't download the language. Check your connection, then choose it again in Astrelle Settings.
astrelle-language-system = Same as your system ({ $language })
astrelle-language-downloading = Downloading…
astrelle-language-restart-needed = Restart Astrelle to see it in this language.
astrelle-media-play = Play
astrelle-media-pause = Pause
astrelle-media-previous = Previous
astrelle-media-next = Next
astrelle-media-mute = Mute
astrelle-media-unmute = Unmute
astrelle-media-close = Hide until it plays again
astrelle-media-go-to-tab = Go to the tab playing { $title }
