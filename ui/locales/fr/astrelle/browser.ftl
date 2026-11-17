# Astrelle : la fenêtre du navigateur (barre latérale, menus, boutons). Traduit de l’anglais.

## La barre latérale, la barre d’outils et les menus

astrelle-frosted-glass = Verre dépoli
astrelle-compact-mode = Mode compact
astrelle-compact-mode-tooltip = Mode compact : masquer la barre latérale jusqu’à ce que la souris atteigne le bord (Ctrl+Alt+C)
astrelle-compact-mode-item = Mode compact
astrelle-compact-mode-description = Masquer la barre latérale jusqu’à ce que la souris atteigne le bord de la fenêtre (Ctrl+Alt+C)
astrelle-manage-settings = Gérer les paramètres d’Astrelle
astrelle-new-private-window-tooltip = Nouvelle fenêtre privée (Ctrl+Maj+P)
astrelle-settings-menu = Paramètres d’Astrelle…
astrelle-settings = Paramètres d’Astrelle
astrelle-split-view = Vue partagée
astrelle-split-view-tooltip = Vue partagée : afficher deux onglets côte à côte (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Ouvrir dans un onglet
astrelle-peek-close = Fermer (Échap)

## Espaces de travail

astrelle-workspaces = Espaces de travail
astrelle-workspace-new-title = Nouvel espace de travail
astrelle-workspace-new-prompt = Nom du nouvel espace de travail :
astrelle-workspace-rename-title = Renommer l’espace de travail
astrelle-workspace-rename-prompt = Nouveau nom :
astrelle-workspace-delete-title = Supprimer l’espace de travail
# $name : l’espace de travail ; $tabs : combien d’onglets il a ; $heir : où ils vont.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] Supprimer « { $name } » ? Il n’a aucun onglet à déplacer.
        [one] Supprimer « { $name } » ? Son onglet ira dans « { $heir } ».
       *[other] Supprimer « { $name } » ? Ses { $tabs } onglets iront dans « { $heir } ».
    }
astrelle-workspace-button-title = { $name } (clic droit pour renommer ou supprimer)
astrelle-workspace-add-title = Nouvel espace de travail : un ensemble d’onglets à part, comme Études ou Travail
astrelle-workspace-add = Nouvel espace de travail
astrelle-workspace-rename = Renommer…
astrelle-workspace-delete = Supprimer…
astrelle-move-to-workspace = Déplacer vers l’espace de travail

## Nouvel onglet

astrelle-newtab-pin = Épingler
astrelle-newtab-unpin = Désépingler

## Accueil et paramètres

astrelle-addon-downloading = Téléchargement et activation…
astrelle-protection-on = La protection est activée ✓
astrelle-protection-off = La protection est désactivée
astrelle-turning-on = Activation…
astrelle-turning-off = Désactivation…
astrelle-download-failed = Le téléchargement a échoué. Vérifiez votre connexion et réessayez.
astrelle-download-failed-skip = Le téléchargement a échoué. Vérifiez votre connexion et réessayez, ou passez cette étape pour l’instant.
astrelle-welcome-done-both = La protection et Sip sont activés. Vous pouvez changer cela à tout moment dans les paramètres d’Astrelle.
astrelle-welcome-done-protection = La protection est activée. Vous pouvez changer cela à tout moment dans les paramètres d’Astrelle.
astrelle-welcome-done-sip = Sip est activé. Vous pouvez changer cela à tout moment dans les paramètres d’Astrelle.
astrelle-welcome-done-none = Vous pouvez activer la protection ou Sip à tout moment dans les paramètres d’Astrelle.
astrelle-choose-wallpaper = Choisir un fond d’écran
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-theme = Votre thème
astrelle-wallpaper-desktop = Votre bureau
astrelle-choose-picture = Choisir une image…
astrelle-sip-used-saved = Sip compte à partir de là ✓
astrelle-sip-used-invalid = Indiquez ce que votre opérateur dit que vous avez utilisé, en Go.

## Langues

# $language : le nom d’une langue dans cette langue, p. ex. العربية
astrelle-language-offer = Les menus et boîtes de dialogue d’Astrelle sont disponibles en { $language }. Les télécharger (moins de 1 Mo) ?
astrelle-language-download = Télécharger
astrelle-language-not-now = Pas maintenant
astrelle-language-restart-to = Redémarrez Astrelle pour terminer le passage en { $language }.
astrelle-language-restart = Redémarrer
astrelle-language-failed = Le téléchargement de la langue a échoué. Vérifiez votre connexion, puis choisissez-la à nouveau dans les paramètres d’Astrelle.
astrelle-language-system = Comme votre système ({ $language })
astrelle-language-downloading = Téléchargement…
astrelle-language-restart-needed = Redémarrez Astrelle pour l’afficher dans cette langue.

## Contrôles des médias

astrelle-media-play = Lecture
astrelle-media-pause = Pause
astrelle-media-previous = Précédent
astrelle-media-next = Suivant
astrelle-media-mute = Couper le son
astrelle-media-unmute = Rétablir le son
astrelle-media-close = Masquer jusqu’à la prochaine lecture
astrelle-media-go-to-tab = Aller à l’onglet qui lit { $title }
astrelle-media-restart = Revenir au début
astrelle-media-skip-to-end = Aller à la fin (puis au suivant, si le site en lit un)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Une nouvelle version d’Astrelle est disponible, avec les derniers correctifs.
astrelle-update-now = Mettre à jour
astrelle-update-download = Télécharger
astrelle-update-updating = Mise à jour d’Astrelle… Vous pouvez continuer à naviguer.
astrelle-update-restart-to = Astrelle est à jour. Redémarrez-le pour terminer.
astrelle-update-failed = Impossible de mettre à jour Astrelle. Vérifiez votre connexion ; la mise à jour sera proposée à nouveau demain.
