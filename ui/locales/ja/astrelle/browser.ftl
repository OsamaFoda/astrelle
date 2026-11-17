# Astrelle: ブラウザーウィンドウ。英語から翻訳。

## The sidebar, toolbar and menus

astrelle-frosted-glass = すりガラス
astrelle-compact-mode = コンパクトモード
astrelle-compact-mode-tooltip = コンパクトモード: マウスが端に来るまでサイドバーを隠します (Ctrl+Alt+C)
astrelle-compact-mode-item = コンパクトモード
astrelle-compact-mode-description = マウスがウィンドウの端に来るまでサイドバーを隠します (Ctrl+Alt+C)
astrelle-manage-settings = Astrelle の設定を管理
astrelle-new-private-window-tooltip = 新しいプライベートウィンドウ (Ctrl+Shift+P)
astrelle-settings-menu = Astrelle の設定…
astrelle-settings = Astrelle の設定
astrelle-split-view = 分割ビュー
astrelle-split-view-tooltip = 分割ビュー: 2 つのタブを並べて表示します (Ctrl+Alt+S)
astrelle-peek-open-in-tab = タブで開く
astrelle-peek-close = 閉じる (Esc)

## Workspaces

astrelle-workspaces = ワークスペース
astrelle-workspace-new-title = 新しいワークスペース
astrelle-workspace-new-prompt = 新しいワークスペースの名前:
astrelle-workspace-rename-title = ワークスペースの名前を変更
astrelle-workspace-rename-prompt = 新しい名前:
astrelle-workspace-delete-title = ワークスペースを削除
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] 「{ $name }」を削除しますか? 移動するタブはありません。
       *[other] 「{ $name }」を削除しますか? { $tabs } 個のタブは「{ $heir }」へ移動します。
    }
astrelle-workspace-button-title = { $name } (右クリックで名前の変更または削除)
astrelle-workspace-add-title = 新しいワークスペース: 切り替えて使える別のタブのまとまり。「勉強」や「仕事」など
astrelle-workspace-add = 新しいワークスペース
astrelle-workspace-rename = 名前を変更…
astrelle-workspace-delete = 削除…
astrelle-move-to-workspace = ワークスペースへ移動

## New Tab

astrelle-newtab-pin = ピン留め
astrelle-newtab-unpin = ピン留めを外す

## Welcome and Settings

astrelle-addon-downloading = ダウンロードしてオンにしています…
astrelle-protection-on = 保護はオンです ✓
astrelle-protection-off = 保護はオフです
astrelle-turning-on = オンにしています…
astrelle-turning-off = オフにしています…
astrelle-download-failed = ダウンロードできませんでした。接続を確認して、もう一度お試しください。
astrelle-download-failed-skip = ダウンロードできませんでした。接続を確認してもう一度お試しいただくか、今はスキップしてください。
astrelle-welcome-done-both = 保護と Sip がオンです。Astrelle の設定でいつでも変更できます。
astrelle-welcome-done-protection = 保護がオンです。Astrelle の設定でいつでも変更できます。
astrelle-welcome-done-sip = Sip がオンです。Astrelle の設定でいつでも変更できます。
astrelle-welcome-done-none = 保護や Sip は Astrelle の設定でいつでもオンにできます。
astrelle-choose-wallpaper = 壁紙を選ぶ
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-theme = テーマ
astrelle-wallpaper-desktop = デスクトップ
astrelle-choose-picture = 画像を選ぶ…
astrelle-sip-used-saved = Sip はここから数え続けます ✓
astrelle-sip-used-invalid = 通信会社が示す使用量を GB で入力してください。

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Astrelle のメニューとダイアログは{ $language }でも利用できます。ダウンロードしますか (1 MB 未満)?
astrelle-language-download = ダウンロード
astrelle-language-not-now = 今はしない
astrelle-language-restart-to = { $language }への切り替えを完了するには Astrelle を再起動してください。
astrelle-language-restart = 再起動
astrelle-language-failed = 言語をダウンロードできませんでした。接続を確認してから、Astrelle の設定でもう一度選んでください。
astrelle-language-system = システムと同じ ({ $language })
astrelle-language-downloading = ダウンロード中…
astrelle-language-restart-needed = この言語で表示するには Astrelle を再起動してください。
astrelle-media-play = 再生
astrelle-media-pause = 一時停止
astrelle-media-previous = 前へ
astrelle-media-next = 次へ
astrelle-media-mute = ミュート
astrelle-media-unmute = ミュート解除
astrelle-media-close = 次に再生されるまで隠す
astrelle-media-go-to-tab = { $title } を再生中のタブへ移動
astrelle-media-restart = 最初に戻る
astrelle-media-skip-to-end = 最後へ (サイトが次を再生する場合は次へ)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Astrelle の新しいバージョンが公開されました。最新の修正が含まれています。
astrelle-update-now = 更新
astrelle-update-download = ダウンロード
astrelle-update-updating = Astrelle を更新しています… そのまま閲覧を続けられます。
astrelle-update-restart-to = Astrelle が更新されました。再起動すると完了します。
astrelle-update-failed = Astrelle を更新できませんでした。接続を確認してください。明日もう一度お知らせします。
