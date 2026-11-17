# Astrelle：浏览器窗口。译自英文。

## The sidebar, toolbar and menus

astrelle-frosted-glass = 磨砂玻璃
astrelle-compact-mode = 紧凑模式
astrelle-compact-mode-tooltip = 紧凑模式：隐藏侧栏，直到鼠标移到边缘（Ctrl+Alt+C）
astrelle-compact-mode-item = 紧凑模式
astrelle-compact-mode-description = 隐藏侧栏，直到鼠标移到窗口边缘（Ctrl+Alt+C）
astrelle-manage-settings = 管理 Astrelle 设置
astrelle-new-private-window-tooltip = 新建隐私窗口（Ctrl+Shift+P）
astrelle-settings-menu = Astrelle 设置…
astrelle-settings = Astrelle 设置
astrelle-split-view = 分屏视图
astrelle-split-view-tooltip = 分屏视图：并排显示两个标签页（Ctrl+Alt+S）
astrelle-peek-open-in-tab = 在标签页中打开
astrelle-peek-close = 关闭（Esc）

## Workspaces

astrelle-workspaces = 工作区
astrelle-workspace-new-title = 新建工作区
astrelle-workspace-new-prompt = 新工作区的名称：
astrelle-workspace-rename-title = 重命名工作区
astrelle-workspace-rename-prompt = 新名称：
astrelle-workspace-delete-title = 删除工作区
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] 删除“{ $name }”？它没有需要移动的标签页。
       *[other] 删除“{ $name }”？它的 { $tabs } 个标签页将移到“{ $heir }”。
    }
astrelle-workspace-button-title = { $name }（右键点击可重命名或删除）
astrelle-workspace-add-title = 新建工作区：一组可以切换的独立标签页，例如“学习”或“工作”
astrelle-workspace-add = 新建工作区
astrelle-workspace-rename = 重命名…
astrelle-workspace-delete = 删除…
astrelle-move-to-workspace = 移至工作区

## New Tab

astrelle-newtab-pin = 固定
astrelle-newtab-unpin = 取消固定

## Welcome and Settings

astrelle-addon-downloading = 正在下载并开启…
astrelle-protection-on = 保护已开启 ✓
astrelle-protection-off = 保护已关闭
astrelle-turning-on = 正在开启…
astrelle-turning-off = 正在关闭…
astrelle-download-failed = 下载失败。请检查网络连接后重试。
astrelle-download-failed-skip = 下载失败。请检查网络连接后重试，或暂时跳过。
astrelle-welcome-done-both = 保护和 Sip 已开启。你可以随时在 Astrelle 设置中更改。
astrelle-welcome-done-protection = 保护已开启。你可以随时在 Astrelle 设置中更改。
astrelle-welcome-done-sip = Sip 已开启。你可以随时在 Astrelle 设置中更改。
astrelle-welcome-done-none = 你可以随时在 Astrelle 设置中开启保护或 Sip。
astrelle-choose-wallpaper = 选择壁纸
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-calm = 宁静夜空
astrelle-wallpaper-theme = 你的主题
astrelle-wallpaper-desktop = 你的桌面
astrelle-choose-picture = 选择图片…
astrelle-sip-used-saved = Sip 将从这里继续计数 ✓
astrelle-sip-used-invalid = 请输入运营商显示的已用流量，单位为 GB。

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Astrelle 的菜单和对话框有{ $language }版本。是否下载（不到 1 MB）？
astrelle-language-download = 下载
astrelle-language-not-now = 以后再说
astrelle-language-restart-to = 重启 Astrelle 以完成切换到{ $language }。
astrelle-language-restart = 重启
astrelle-language-failed = 无法下载该语言。请检查网络连接，然后在 Astrelle 设置中重新选择。
astrelle-language-system = 与系统相同（{ $language }）
astrelle-language-downloading = 正在下载…
astrelle-language-restart-needed = 重启 Astrelle 后即可以该语言显示。
astrelle-media-play = 播放
astrelle-media-pause = 暂停
astrelle-media-previous = 上一个
astrelle-media-next = 下一个
astrelle-media-mute = 静音
astrelle-media-unmute = 取消静音
astrelle-media-close = 隐藏，直到再次播放
astrelle-media-go-to-tab = 转到正在播放 { $title } 的标签页
astrelle-media-restart = 回到开头
astrelle-media-skip-to-end = 跳到结尾（如果网站会播放下一个，就到下一个）

## Updates (scripts/updates.mjs)

astrelle-update-ready = Astrelle 有新版本了，包含最新的修复。
astrelle-update-now = 更新
astrelle-update-download = 下载
astrelle-update-updating = 正在更新 Astrelle…你可以继续浏览。
astrelle-update-restart-to = Astrelle 已更新，重新启动即可完成。
astrelle-update-failed = 无法更新 Astrelle。请检查网络连接；明天会再次提示。
