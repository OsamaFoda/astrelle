# Astrelle: окно браузера. Переведено с английского.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Матовое стекло
astrelle-compact-mode = Компактный режим
astrelle-compact-mode-tooltip = Компактный режим: скрывать боковую панель, пока мышь не дойдёт до края (Ctrl+Alt+C)
astrelle-compact-mode-item = Компактный режим
astrelle-compact-mode-description = Скрывать боковую панель, пока мышь не дойдёт до края окна (Ctrl+Alt+C)
astrelle-manage-settings = Управление настройками Astrelle
astrelle-new-private-window-tooltip = Новое приватное окно (Ctrl+Shift+P)
astrelle-settings-menu = Настройки Astrelle…
astrelle-settings = Настройки Astrelle
astrelle-split-view = Разделённый вид
astrelle-split-view-tooltip = Разделённый вид: показать две вкладки рядом (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Открыть во вкладке
astrelle-peek-close = Закрыть (Esc)

## Workspaces

astrelle-workspaces = Рабочие пространства
astrelle-workspace-new-title = Новое рабочее пространство
astrelle-workspace-new-prompt = Название нового рабочего пространства:
astrelle-workspace-rename-title = Переименовать рабочее пространство
astrelle-workspace-rename-prompt = Новое название:
astrelle-workspace-delete-title = Удалить рабочее пространство
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] Удалить «{ $name }»? В нём нет вкладок для переноса.
        [one] Удалить «{ $name }»? Его { $tabs } вкладка перейдёт в «{ $heir }».
        [few] Удалить «{ $name }»? Его { $tabs } вкладки перейдут в «{ $heir }».
        [many] Удалить «{ $name }»? Его { $tabs } вкладок перейдут в «{ $heir }».
       *[other] Удалить «{ $name }»? Его { $tabs } вкладки перейдут в «{ $heir }».
    }
astrelle-workspace-button-title = { $name } (правый щелчок, чтобы переименовать или удалить)
astrelle-workspace-add-title = Новое рабочее пространство: отдельный набор вкладок, между которыми можно переключаться, например Учёба или Работа
astrelle-workspace-add = Новое рабочее пространство
astrelle-workspace-rename = Переименовать…
astrelle-workspace-delete = Удалить…
astrelle-move-to-workspace = Переместить в рабочее пространство

## New Tab

astrelle-newtab-pin = Закрепить
astrelle-newtab-unpin = Открепить

## Welcome and Settings

astrelle-addon-downloading = Загрузка и включение…
astrelle-protection-on = Защита включена ✓
astrelle-protection-off = Защита выключена
astrelle-turning-on = Включение…
astrelle-turning-off = Выключение…
astrelle-download-failed = Не удалось загрузить. Проверьте подключение и попробуйте ещё раз.
astrelle-download-failed-skip = Не удалось загрузить. Проверьте подключение и попробуйте ещё раз или пропустите пока.
astrelle-welcome-done-both = Защита и Sip включены. Это можно изменить в любой момент в настройках Astrelle.
astrelle-welcome-done-protection = Защита включена. Это можно изменить в любой момент в настройках Astrelle.
astrelle-welcome-done-sip = Sip включён. Это можно изменить в любой момент в настройках Astrelle.
astrelle-welcome-done-none = Включить защиту или Sip можно в любой момент в настройках Astrelle.
astrelle-choose-wallpaper = Выбрать обои
astrelle-wallpaper-theme = Ваша тема
astrelle-wallpaper-desktop = Ваш рабочий стол
astrelle-choose-picture = Выбрать изображение…
astrelle-sip-used-saved = Sip продолжит счёт отсюда ✓
astrelle-sip-used-invalid = Введите, сколько, по словам оператора, вы израсходовали, в ГБ.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Меню и диалоги Astrelle доступны на языке «{ $language }». Загрузить их (меньше 1 МБ)?
astrelle-language-download = Загрузить
astrelle-language-not-now = Не сейчас
astrelle-language-restart-to = Перезапустите Astrelle, чтобы завершить переход на язык «{ $language }».
astrelle-language-restart = Перезапустить
astrelle-language-failed = Не удалось загрузить язык. Проверьте подключение, затем выберите его снова в настройках Astrelle.
astrelle-language-system = Как в системе ({ $language })
astrelle-language-downloading = Загрузка…
astrelle-language-restart-needed = Перезапустите Astrelle, чтобы увидеть его на этом языке.
astrelle-media-play = Воспроизвести
astrelle-media-pause = Пауза
astrelle-media-previous = Предыдущее
astrelle-media-next = Следующее
astrelle-media-mute = Выключить звук
astrelle-media-unmute = Включить звук
astrelle-media-close = Скрыть до следующего воспроизведения
astrelle-media-go-to-tab = Перейти к вкладке, где играет { $title }
astrelle-media-restart = В начало
astrelle-media-skip-to-end = В конец (и к следующему, если сайт его включает)
