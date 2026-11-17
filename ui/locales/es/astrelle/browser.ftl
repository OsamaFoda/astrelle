# Astrelle: la ventana del navegador. Traducido del inglés.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Vidrio esmerilado
astrelle-compact-mode = Modo compacto
astrelle-compact-mode-tooltip = Modo compacto: ocultar la barra lateral hasta que el ratón llegue al borde (Ctrl+Alt+C)
astrelle-compact-mode-item = Modo compacto
astrelle-compact-mode-description = Ocultar la barra lateral hasta que el ratón llegue al borde de la ventana (Ctrl+Alt+C)
astrelle-manage-settings = Gestionar los ajustes de Astrelle
astrelle-new-private-window-tooltip = Nueva ventana privada (Ctrl+Mayús+P)
astrelle-settings-menu = Ajustes de Astrelle…
astrelle-settings = Ajustes de Astrelle
astrelle-split-view = Vista dividida
astrelle-split-view-tooltip = Vista dividida: mostrar dos pestañas una al lado de la otra (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Abrir en una pestaña
astrelle-peek-close = Cerrar (Esc)

## Workspaces

astrelle-workspaces = Espacios de trabajo
astrelle-workspace-new-title = Nuevo espacio de trabajo
astrelle-workspace-new-prompt = Nombre del nuevo espacio de trabajo:
astrelle-workspace-rename-title = Renombrar espacio de trabajo
astrelle-workspace-rename-prompt = Nuevo nombre:
astrelle-workspace-delete-title = Eliminar espacio de trabajo
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] ¿Eliminar “{ $name }”? No tiene pestañas que mover.
        [one] ¿Eliminar “{ $name }”? Su pestaña irá a “{ $heir }”.
       *[other] ¿Eliminar “{ $name }”? Sus { $tabs } pestañas irán a “{ $heir }”.
    }
astrelle-workspace-button-title = { $name } (clic derecho para renombrar o eliminar)
astrelle-workspace-add-title = Nuevo espacio de trabajo: un grupo aparte de pestañas al que cambiar, como Estudio o Trabajo
astrelle-workspace-add = Nuevo espacio de trabajo
astrelle-workspace-rename = Renombrar…
astrelle-workspace-delete = Eliminar…
astrelle-move-to-workspace = Mover a espacio de trabajo

## New Tab

astrelle-newtab-pin = Fijar
astrelle-newtab-unpin = Desfijar

## Welcome and Settings

astrelle-addon-downloading = Descargando y activando…
astrelle-protection-on = La protección está activada ✓
astrelle-protection-off = La protección está desactivada
astrelle-turning-on = Activando…
astrelle-turning-off = Desactivando…
astrelle-download-failed = No se pudo descargar. Comprueba tu conexión e inténtalo de nuevo.
astrelle-download-failed-skip = No se pudo descargar. Comprueba tu conexión e inténtalo de nuevo, o sáltalo por ahora.
astrelle-welcome-done-both = La protección y Sip están activados. Puedes cambiarlo cuando quieras en los ajustes de Astrelle.
astrelle-welcome-done-protection = La protección está activada. Puedes cambiarlo cuando quieras en los ajustes de Astrelle.
astrelle-welcome-done-sip = Sip está activado. Puedes cambiarlo cuando quieras en los ajustes de Astrelle.
astrelle-welcome-done-none = Puedes activar la protección o Sip cuando quieras en los ajustes de Astrelle.
astrelle-choose-wallpaper = Elegir un fondo de pantalla
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-theme = Tu tema
astrelle-wallpaper-desktop = Tu escritorio
astrelle-choose-picture = Elegir una imagen…
astrelle-sip-used-saved = Sip sigue contando desde ahí ✓
astrelle-sip-used-invalid = Escribe lo que tu operador dice que has usado, en GB.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Los menús y diálogos de Astrelle están disponibles en { $language }. ¿Descargarlos (menos de 1 MB)?
astrelle-language-download = Descargar
astrelle-language-not-now = Ahora no
astrelle-language-restart-to = Reinicia Astrelle para terminar de cambiar a { $language }.
astrelle-language-restart = Reiniciar
astrelle-language-failed = No se pudo descargar el idioma. Comprueba tu conexión y vuelve a elegirlo en los ajustes de Astrelle.
astrelle-language-system = Igual que tu sistema ({ $language })
astrelle-language-downloading = Descargando…
astrelle-language-restart-needed = Reinicia Astrelle para verlo en este idioma.
astrelle-media-play = Reproducir
astrelle-media-pause = Pausa
astrelle-media-previous = Anterior
astrelle-media-next = Siguiente
astrelle-media-mute = Silenciar
astrelle-media-unmute = Activar sonido
astrelle-media-close = Ocultar hasta que vuelva a sonar
astrelle-media-go-to-tab = Ir a la pestaña que reproduce { $title }
astrelle-media-restart = Volver al principio
astrelle-media-skip-to-end = Saltar al final (y al siguiente, donde el sitio reproduce uno)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Hay una nueva versión de Astrelle, con las últimas correcciones.
astrelle-update-now = Actualizar
astrelle-update-download = Descargar
astrelle-update-updating = Actualizando Astrelle… Puedes seguir navegando.
astrelle-update-restart-to = Astrelle se ha actualizado. Reinícialo para terminar.
astrelle-update-failed = No se pudo actualizar Astrelle. Comprueba tu conexión; mañana se volverá a ofrecer.
