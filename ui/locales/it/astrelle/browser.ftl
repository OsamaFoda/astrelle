# Astrelle: la finestra del browser. Tradotto dall’inglese.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Vetro smerigliato
astrelle-compact-mode = Modalità compatta
astrelle-compact-mode-tooltip = Modalità compatta: nascondi la barra laterale finché il mouse non raggiunge il bordo (Ctrl+Alt+C)
astrelle-compact-mode-item = Modalità compatta
astrelle-compact-mode-description = Nascondi la barra laterale finché il mouse non raggiunge il bordo della finestra (Ctrl+Alt+C)
astrelle-manage-settings = Gestisci le impostazioni di Astrelle
astrelle-new-private-window-tooltip = Nuova finestra anonima (Ctrl+Maiusc+P)
astrelle-settings-menu = Impostazioni di Astrelle…
astrelle-settings = Impostazioni di Astrelle
astrelle-split-view = Vista divisa
astrelle-split-view-tooltip = Vista divisa: mostra due schede affiancate (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Apri in una scheda
astrelle-peek-close = Chiudi (Esc)

## Workspaces

astrelle-workspaces = Aree di lavoro
astrelle-workspace-new-title = Nuova area di lavoro
astrelle-workspace-new-prompt = Nome della nuova area di lavoro:
astrelle-workspace-rename-title = Rinomina area di lavoro
astrelle-workspace-rename-prompt = Nuovo nome:
astrelle-workspace-delete-title = Elimina area di lavoro
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] Eliminare “{ $name }”? Non ha schede da spostare.
        [one] Eliminare “{ $name }”? La sua scheda andrà in “{ $heir }”.
       *[other] Eliminare “{ $name }”? Le sue { $tabs } schede andranno in “{ $heir }”.
    }
astrelle-workspace-button-title = { $name } (clic destro per rinominare o eliminare)
astrelle-workspace-add-title = Nuova area di lavoro: un gruppo separato di schede tra cui passare, come Studio o Lavoro
astrelle-workspace-add = Nuova area di lavoro
astrelle-workspace-rename = Rinomina…
astrelle-workspace-delete = Elimina…
astrelle-move-to-workspace = Sposta in un’area di lavoro

## New Tab

astrelle-newtab-pin = Fissa
astrelle-newtab-unpin = Rimuovi fissaggio

## Welcome and Settings

astrelle-addon-downloading = Download e attivazione…
astrelle-protection-on = La protezione è attiva ✓
astrelle-protection-off = La protezione è disattivata
astrelle-turning-on = Attivazione…
astrelle-turning-off = Disattivazione…
astrelle-download-failed = Download non riuscito. Controlla la connessione e riprova.
astrelle-download-failed-skip = Download non riuscito. Controlla la connessione e riprova, oppure salta per ora.
astrelle-welcome-done-both = Protezione e Sip sono attivi. Puoi cambiarlo in qualsiasi momento nelle impostazioni di Astrelle.
astrelle-welcome-done-protection = La protezione è attiva. Puoi cambiarlo in qualsiasi momento nelle impostazioni di Astrelle.
astrelle-welcome-done-sip = Sip è attivo. Puoi cambiarlo in qualsiasi momento nelle impostazioni di Astrelle.
astrelle-welcome-done-none = Puoi attivare la protezione o Sip in qualsiasi momento nelle impostazioni di Astrelle.
astrelle-choose-wallpaper = Scegli uno sfondo
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-calm = Cielo sereno
astrelle-wallpaper-theme = Il tuo tema
astrelle-wallpaper-desktop = Il tuo desktop
astrelle-choose-picture = Scegli un’immagine…
astrelle-sip-used-saved = Sip continua a contare da lì ✓
astrelle-sip-used-invalid = Inserisci quanto il tuo operatore dice che hai usato, in GB.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = I menu e le finestre di dialogo di Astrelle sono disponibili in { $language }. Scaricarli (meno di 1 MB)?
astrelle-language-download = Scarica
astrelle-language-not-now = Non ora
astrelle-language-restart-to = Riavvia Astrelle per completare il passaggio a { $language }.
astrelle-language-restart = Riavvia
astrelle-language-failed = Impossibile scaricare la lingua. Controlla la connessione, poi sceglila di nuovo nelle impostazioni di Astrelle.
astrelle-language-system = Come il tuo sistema ({ $language })
astrelle-language-downloading = Download in corso…
astrelle-language-restart-needed = Riavvia Astrelle per vederlo in questa lingua.
astrelle-media-play = Riproduci
astrelle-media-pause = Pausa
astrelle-media-previous = Precedente
astrelle-media-next = Successivo
astrelle-media-mute = Disattiva audio
astrelle-media-unmute = Attiva audio
astrelle-media-close = Nascondi finché non riprende
astrelle-media-go-to-tab = Vai alla scheda che riproduce { $title }
astrelle-media-restart = Torna all’inizio
astrelle-media-skip-to-end = Vai alla fine (e al successivo, dove il sito ne riproduce uno)

## Updates (scripts/updates.mjs)

astrelle-update-ready = È disponibile una nuova versione di Astrelle, con le ultime correzioni.
astrelle-update-now = Aggiorna
astrelle-update-download = Scarica
astrelle-update-updating = Aggiornamento di Astrelle in corso… Puoi continuare a navigare.
astrelle-update-restart-to = Astrelle è aggiornato. Riavvialo per completare.
astrelle-update-failed = Impossibile aggiornare Astrelle. Controlla la connessione; l’aggiornamento verrà riproposto domani.
