# Astrelle: a janela do navegador. Traduzido do inglês.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Vidro fosco
astrelle-compact-mode = Modo compacto
astrelle-compact-mode-tooltip = Modo compacto: ocultar a barra lateral até o mouse chegar à borda (Ctrl+Alt+C)
astrelle-compact-mode-item = Modo compacto
astrelle-compact-mode-description = Ocultar a barra lateral até o mouse chegar à borda da janela (Ctrl+Alt+C)
astrelle-manage-settings = Gerenciar as configurações do Astrelle
astrelle-new-private-window-tooltip = Nova janela privativa (Ctrl+Shift+P)
astrelle-settings-menu = Configurações do Astrelle…
astrelle-settings = Configurações do Astrelle
astrelle-split-view = Visão dividida
astrelle-split-view-tooltip = Visão dividida: mostrar duas abas lado a lado (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Abrir em uma aba
astrelle-peek-close = Fechar (Esc)

## Workspaces

astrelle-workspaces = Espaços de trabalho
astrelle-workspace-new-title = Novo espaço de trabalho
astrelle-workspace-new-prompt = Nome do novo espaço de trabalho:
astrelle-workspace-rename-title = Renomear espaço de trabalho
astrelle-workspace-rename-prompt = Novo nome:
astrelle-workspace-delete-title = Excluir espaço de trabalho
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] Excluir “{ $name }”? Ele não tem abas para mover.
        [one] Excluir “{ $name }”? A aba dele irá para “{ $heir }”.
       *[other] Excluir “{ $name }”? As { $tabs } abas dele irão para “{ $heir }”.
    }
astrelle-workspace-button-title = { $name } (clique com o botão direito para renomear ou excluir)
astrelle-workspace-add-title = Novo espaço de trabalho: um conjunto separado de abas para alternar, como Estudos ou Trabalho
astrelle-workspace-add = Novo espaço de trabalho
astrelle-workspace-rename = Renomear…
astrelle-workspace-delete = Excluir…
astrelle-move-to-workspace = Mover para espaço de trabalho

## New Tab

astrelle-newtab-pin = Fixar
astrelle-newtab-unpin = Desafixar

## Welcome and Settings

astrelle-addon-downloading = Baixando e ativando…
astrelle-protection-on = A proteção está ativada ✓
astrelle-protection-off = A proteção está desativada
astrelle-turning-on = Ativando…
astrelle-turning-off = Desativando…
astrelle-download-failed = Não foi possível baixar. Verifique sua conexão e tente de novo.
astrelle-download-failed-skip = Não foi possível baixar. Verifique sua conexão e tente de novo, ou pule por enquanto.
astrelle-welcome-done-both = A proteção e o Sip estão ativados. Você pode mudar isso a qualquer momento nas configurações do Astrelle.
astrelle-welcome-done-protection = A proteção está ativada. Você pode mudar isso a qualquer momento nas configurações do Astrelle.
astrelle-welcome-done-sip = O Sip está ativado. Você pode mudar isso a qualquer momento nas configurações do Astrelle.
astrelle-welcome-done-none = Você pode ativar a proteção ou o Sip a qualquer momento nas configurações do Astrelle.
astrelle-choose-wallpaper = Escolher um papel de parede
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-calm = Céu calmo
astrelle-wallpaper-theme = Seu tema
astrelle-wallpaper-desktop = Sua área de trabalho
astrelle-choose-picture = Escolher uma imagem…
astrelle-sip-used-saved = O Sip continua contando a partir daí ✓
astrelle-sip-used-invalid = Digite o que sua operadora diz que você usou, em GB.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Os menus e diálogos do Astrelle estão disponíveis em { $language }. Baixá-los (menos de 1 MB)?
astrelle-language-download = Baixar
astrelle-language-not-now = Agora não
astrelle-language-restart-to = Reinicie o Astrelle para terminar a mudança para { $language }.
astrelle-language-restart = Reiniciar
astrelle-language-failed = Não foi possível baixar o idioma. Verifique sua conexão e escolha-o de novo nas configurações do Astrelle.
astrelle-language-system = Igual ao seu sistema ({ $language })
astrelle-language-downloading = Baixando…
astrelle-language-restart-needed = Reinicie o Astrelle para vê-lo neste idioma.
astrelle-media-play = Reproduzir
astrelle-media-pause = Pausar
astrelle-media-previous = Anterior
astrelle-media-next = Próximo
astrelle-media-mute = Silenciar
astrelle-media-unmute = Ativar som
astrelle-media-close = Ocultar até tocar de novo
astrelle-media-go-to-tab = Ir para a aba que está tocando { $title }
astrelle-media-restart = Voltar ao início
astrelle-media-skip-to-end = Pular para o fim (e para o próximo, quando o site toca um)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Uma nova versão do Astrelle está disponível, com as correções mais recentes.
astrelle-update-now = Atualizar
astrelle-update-download = Baixar
astrelle-update-updating = Atualizando o Astrelle… Você pode continuar navegando.
astrelle-update-restart-to = O Astrelle foi atualizado. Reinicie-o para concluir.
astrelle-update-failed = Não foi possível atualizar o Astrelle. Verifique sua conexão; a atualização será oferecida de novo amanhã.
