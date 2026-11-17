# Astrelle: das Browserfenster. Aus dem Englischen übersetzt.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Milchglas
astrelle-compact-mode = Kompaktmodus
astrelle-compact-mode-tooltip = Kompaktmodus: Seitenleiste ausblenden, bis die Maus den Rand erreicht (Strg+Alt+C)
astrelle-compact-mode-item = Kompaktmodus
astrelle-compact-mode-description = Seitenleiste ausblenden, bis die Maus den Fensterrand erreicht (Strg+Alt+C)
astrelle-manage-settings = Astrelle-Einstellungen verwalten
astrelle-new-private-window-tooltip = Neues privates Fenster (Strg+Umschalt+P)
astrelle-settings-menu = Astrelle-Einstellungen…
astrelle-settings = Astrelle-Einstellungen
astrelle-split-view = Geteilte Ansicht
astrelle-split-view-tooltip = Geteilte Ansicht: zwei Tabs nebeneinander anzeigen (Strg+Alt+S)
astrelle-peek-open-in-tab = In Tab öffnen
astrelle-peek-close = Schließen (Esc)

## Workspaces

astrelle-workspaces = Arbeitsbereiche
astrelle-workspace-new-title = Neuer Arbeitsbereich
astrelle-workspace-new-prompt = Name des neuen Arbeitsbereichs:
astrelle-workspace-rename-title = Arbeitsbereich umbenennen
astrelle-workspace-rename-prompt = Neuer Name:
astrelle-workspace-delete-title = Arbeitsbereich löschen
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] „{ $name }“ löschen? Es enthält keine Tabs.
        [one] „{ $name }“ löschen? Sein Tab wird nach „{ $heir }“ verschoben.
       *[other] „{ $name }“ löschen? Seine { $tabs } Tabs werden nach „{ $heir }“ verschoben.
    }
astrelle-workspace-button-title = { $name } (Rechtsklick zum Umbenennen oder Löschen)
astrelle-workspace-add-title = Neuer Arbeitsbereich: eine eigene Gruppe von Tabs zum Wechseln, etwa Studium oder Arbeit
astrelle-workspace-add = Neuer Arbeitsbereich
astrelle-workspace-rename = Umbenennen…
astrelle-workspace-delete = Löschen…
astrelle-move-to-workspace = In Arbeitsbereich verschieben

## New Tab

astrelle-newtab-pin = Anheften
astrelle-newtab-unpin = Lösen

## Welcome and Settings

astrelle-addon-downloading = Wird heruntergeladen und eingeschaltet…
astrelle-protection-on = Schutz ist eingeschaltet ✓
astrelle-protection-off = Schutz ist ausgeschaltet
astrelle-turning-on = Wird eingeschaltet…
astrelle-turning-off = Wird ausgeschaltet…
astrelle-download-failed = Herunterladen fehlgeschlagen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.
astrelle-download-failed-skip = Herunterladen fehlgeschlagen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut, oder überspringen Sie es vorerst.
astrelle-welcome-done-both = Schutz und Sip sind eingeschaltet. Sie können das jederzeit in den Astrelle-Einstellungen ändern.
astrelle-welcome-done-protection = Schutz ist eingeschaltet. Sie können das jederzeit in den Astrelle-Einstellungen ändern.
astrelle-welcome-done-sip = Sip ist eingeschaltet. Sie können das jederzeit in den Astrelle-Einstellungen ändern.
astrelle-welcome-done-none = Sie können Schutz oder Sip jederzeit in den Astrelle-Einstellungen einschalten.
astrelle-choose-wallpaper = Hintergrundbild wählen
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-theme = Ihr Farbschema
astrelle-wallpaper-desktop = Ihr Desktop
astrelle-choose-picture = Bild wählen…
astrelle-sip-used-saved = Sip zählt ab hier weiter ✓
astrelle-sip-used-invalid = Geben Sie ein, was Ihr Anbieter als verbraucht angibt, in GB.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Astrelles Menüs und Dialoge gibt es auf { $language }. Herunterladen (unter 1 MB)?
astrelle-language-download = Herunterladen
astrelle-language-not-now = Nicht jetzt
astrelle-language-restart-to = Starten Sie Astrelle neu, um den Wechsel zu { $language } abzuschließen.
astrelle-language-restart = Neu starten
astrelle-language-failed = Die Sprache konnte nicht heruntergeladen werden. Prüfen Sie Ihre Verbindung und wählen Sie sie dann erneut in den Astrelle-Einstellungen.
astrelle-language-system = Wie Ihr System ({ $language })
astrelle-language-downloading = Wird heruntergeladen…
astrelle-language-restart-needed = Starten Sie Astrelle neu, um es in dieser Sprache zu sehen.
astrelle-media-play = Abspielen
astrelle-media-pause = Pause
astrelle-media-previous = Zurück
astrelle-media-next = Weiter
astrelle-media-mute = Stummschalten
astrelle-media-unmute = Ton einschalten
astrelle-media-close = Ausblenden, bis wieder etwas spielt
astrelle-media-go-to-tab = Zum Tab, der { $title } abspielt
astrelle-media-restart = Zum Anfang
astrelle-media-skip-to-end = Zum Ende springen (weiter zum nächsten, wo die Seite eines abspielt)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Eine neue Version von Astrelle ist da, mit den neuesten Korrekturen.
astrelle-update-now = Aktualisieren
astrelle-update-download = Herunterladen
astrelle-update-updating = Astrelle wird aktualisiert … Sie können weitersurfen.
astrelle-update-restart-to = Astrelle ist aktualisiert. Starten Sie es neu, um abzuschließen.
astrelle-update-failed = Astrelle konnte nicht aktualisiert werden. Prüfen Sie Ihre Verbindung; morgen wird es erneut angeboten.
