# Astrelle: tarayıcı penceresi. İngilizceden çevrildi.

## The sidebar, toolbar and menus

astrelle-frosted-glass = Buzlu cam
astrelle-compact-mode = Kompakt mod
astrelle-compact-mode-tooltip = Kompakt mod: fare kenara gelene kadar kenar çubuğunu gizle (Ctrl+Alt+C)
astrelle-compact-mode-item = Kompakt mod
astrelle-compact-mode-description = Fare pencerenin kenarına gelene kadar kenar çubuğunu gizle (Ctrl+Alt+C)
astrelle-manage-settings = Astrelle ayarlarını yönet
astrelle-new-private-window-tooltip = Yeni gizli pencere (Ctrl+Shift+P)
astrelle-settings-menu = Astrelle ayarları…
astrelle-settings = Astrelle ayarları
astrelle-split-view = Bölünmüş görünüm
astrelle-split-view-tooltip = Bölünmüş görünüm: iki sekmeyi yan yana göster (Ctrl+Alt+S)
astrelle-peek-open-in-tab = Sekmede aç
astrelle-peek-close = Kapat (Esc)

## Workspaces

astrelle-workspaces = Çalışma alanları
astrelle-workspace-new-title = Yeni çalışma alanı
astrelle-workspace-new-prompt = Yeni çalışma alanının adı:
astrelle-workspace-rename-title = Çalışma alanını yeniden adlandır
astrelle-workspace-rename-prompt = Yeni ad:
astrelle-workspace-delete-title = Çalışma alanını sil
# $name: the workspace; $tabs: how many tabs it has; $heir: where they go.
astrelle-workspace-delete-prompt =
    { $tabs ->
        [0] “{ $name }” silinsin mi? Taşınacak sekmesi yok.
       *[other] “{ $name }” silinsin mi? { $tabs } sekmesi “{ $heir }” alanına taşınacak.
    }
astrelle-workspace-button-title = { $name } (yeniden adlandırmak ya da silmek için sağ tıklayın)
astrelle-workspace-add-title = Yeni çalışma alanı: geçiş yapabileceğiniz ayrı bir sekme grubu, örneğin Ders ya da İş
astrelle-workspace-add = Yeni çalışma alanı
astrelle-workspace-rename = Yeniden adlandır…
astrelle-workspace-delete = Sil…
astrelle-move-to-workspace = Çalışma alanına taşı

## New Tab

astrelle-newtab-pin = Sabitle
astrelle-newtab-unpin = Sabitlemeyi kaldır

## Welcome and Settings

astrelle-addon-downloading = İndiriliyor ve açılıyor…
astrelle-protection-on = Koruma açık ✓
astrelle-protection-off = Koruma kapalı
astrelle-turning-on = Açılıyor…
astrelle-turning-off = Kapatılıyor…
astrelle-download-failed = İndirilemedi. Bağlantınızı kontrol edip yeniden deneyin.
astrelle-download-failed-skip = İndirilemedi. Bağlantınızı kontrol edip yeniden deneyin ya da şimdilik atlayın.
astrelle-welcome-done-both = Koruma ve Sip açık. Bunu istediğiniz zaman Astrelle ayarlarından değiştirebilirsiniz.
astrelle-welcome-done-protection = Koruma açık. Bunu istediğiniz zaman Astrelle ayarlarından değiştirebilirsiniz.
astrelle-welcome-done-sip = Sip açık. Bunu istediğiniz zaman Astrelle ayarlarından değiştirebilirsiniz.
astrelle-welcome-done-none = Korumayı ya da Sip’i istediğiniz zaman Astrelle ayarlarından açabilirsiniz.
astrelle-choose-wallpaper = Duvar kâğıdı seçin
astrelle-wallpaper-astrelle = Astrelle
astrelle-wallpaper-calm = Sakin gökyüzü
astrelle-wallpaper-theme = Temanız
astrelle-wallpaper-desktop = Masaüstünüz
astrelle-choose-picture = Resim seçin…
astrelle-sip-used-saved = Sip saymaya buradan devam ediyor ✓
astrelle-sip-used-invalid = Operatörünüzün kullandığınızı söylediği miktarı GB olarak girin.

## Languages

# $language: a language's own name, e.g. العربية
astrelle-language-offer = Astrelle’in menüleri ve iletişim kutuları { $language } dilinde mevcut. İndirilsin mi (1 MB’tan az)?
astrelle-language-download = İndir
astrelle-language-not-now = Şimdi değil
astrelle-language-restart-to = { $language } diline geçişi tamamlamak için Astrelle’i yeniden başlatın.
astrelle-language-restart = Yeniden başlat
astrelle-language-failed = Dil indirilemedi. Bağlantınızı kontrol edin, sonra Astrelle ayarlarından yeniden seçin.
astrelle-language-system = Sisteminizle aynı ({ $language })
astrelle-language-downloading = İndiriliyor…
astrelle-language-restart-needed = Bu dilde görmek için Astrelle’i yeniden başlatın.
astrelle-media-play = Oynat
astrelle-media-pause = Duraklat
astrelle-media-previous = Önceki
astrelle-media-next = Sonraki
astrelle-media-mute = Sesi kapat
astrelle-media-unmute = Sesi aç
astrelle-media-close = Yeniden çalana kadar gizle
astrelle-media-go-to-tab = { $title } çalan sekmeye git
astrelle-media-restart = Başa dön
astrelle-media-skip-to-end = Sona atla (site bir sonrakini çalıyorsa ona geçer)

## Updates (scripts/updates.mjs)

astrelle-update-ready = Astrelle’ın yeni bir sürümü çıktı, en son düzeltmelerle birlikte.
astrelle-update-now = Güncelle
astrelle-update-download = İndir
astrelle-update-updating = Astrelle güncelleniyor… Gezinmeye devam edebilirsiniz.
astrelle-update-restart-to = Astrelle güncellendi. Tamamlamak için yeniden başlatın.
astrelle-update-failed = Astrelle güncellenemedi. Bağlantınızı kontrol edin; yarın yeniden önerilecek.
