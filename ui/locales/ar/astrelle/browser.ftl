# Astrelle: the browser window, in Arabic.

## The sidebar, toolbar and menus

astrelle-frosted-glass = زجاج مُضبَّب
astrelle-compact-mode = الوضع المضغوط
astrelle-compact-mode-tooltip = الوضع المضغوط: يخفي الشريط الجانبي حتى يصل الفأر إلى الحافة (Ctrl+Alt+C)
astrelle-compact-mode-item = الوضع المضغوط
astrelle-compact-mode-description = يخفي الشريط الجانبي حتى يصل الفأر إلى حافة النافذة (Ctrl+Alt+C)
astrelle-manage-settings = إدارة إعدادات Astrelle
astrelle-new-private-window-tooltip = نافذة خاصة جديدة (Ctrl+Shift+P)
astrelle-settings-menu = إعدادات Astrelle…
astrelle-settings = إعدادات Astrelle
astrelle-split-view = العرض المقسوم
astrelle-split-view-tooltip = العرض المقسوم: لسانان جنبًا إلى جنب (Ctrl+Alt+S)
astrelle-peek-open-in-tab = افتح في لسان
astrelle-peek-close = إغلاق (Esc)

## Workspaces

astrelle-workspaces = مساحات العمل
astrelle-workspace-new-title = مساحة عمل جديدة
astrelle-workspace-new-prompt = اسم مساحة العمل الجديدة:
astrelle-workspace-rename-title = إعادة تسمية مساحة العمل
astrelle-workspace-rename-prompt = الاسم الجديد:
astrelle-workspace-delete-title = حذف مساحة العمل
astrelle-workspace-delete-prompt =
    { $tabs ->
        [zero] حذف «{ $name }»؟ لا توجد فيها ألسنة لنقلها إلى «{ $heir }».
        [one] حذف «{ $name }»؟ سيُنقل لسانها إلى «{ $heir }».
        [two] حذف «{ $name }»؟ سيُنقل لساناها إلى «{ $heir }».
        [few] حذف «{ $name }»؟ ستُنقل ألسنتها الـ{ $tabs } إلى «{ $heir }».
        [many] حذف «{ $name }»؟ ستُنقل ألسنتها الـ{ $tabs } إلى «{ $heir }».
       *[other] حذف «{ $name }»؟ ستُنقل ألسنتها الـ{ $tabs } إلى «{ $heir }».
    }
astrelle-workspace-button-title = { $name } (نقرة يمنى لإعادة التسمية أو الحذف)
astrelle-workspace-add-title = مساحة عمل جديدة: مجموعة منفصلة من الألسنة تنتقل إليها، مثل الدراسة أو العمل
astrelle-workspace-add = مساحة عمل جديدة
astrelle-workspace-rename = إعادة تسمية…
astrelle-workspace-delete = حذف…
astrelle-move-to-workspace = انقل إلى مساحة عمل

## New Tab

astrelle-newtab-pin = تثبيت
astrelle-newtab-unpin = إلغاء التثبيت

## Welcome and Settings

astrelle-addon-downloading = جارٍ التنزيل والتشغيل…
astrelle-protection-on = الحماية تعمل ✓
astrelle-protection-off = الحماية متوقفة
astrelle-turning-on = جارٍ التشغيل…
astrelle-turning-off = جارٍ الإيقاف…
astrelle-download-failed = تعذّر التنزيل. تحقق من اتصالك وحاول مجددًا.
astrelle-download-failed-skip = تعذّر التنزيل. تحقق من اتصالك وحاول مجددًا، أو تخطَّ الآن.
astrelle-welcome-done-both = الحماية وسِب يعملان. يمكنك تغيير ذلك في أي وقت من إعدادات Astrelle.
astrelle-welcome-done-protection = الحماية تعمل. يمكنك تغيير ذلك في أي وقت من إعدادات Astrelle.
astrelle-welcome-done-sip = سِب يعمل. يمكنك تغيير ذلك في أي وقت من إعدادات Astrelle.
astrelle-welcome-done-none = يمكنك تشغيل الحماية أو سِب في أي وقت من إعدادات Astrelle.
astrelle-choose-wallpaper = اختر خلفية
astrelle-wallpaper-theme = سمتك
astrelle-wallpaper-desktop = سطح مكتبك
astrelle-choose-picture = اختر صورة…
astrelle-sip-used-saved = سيكمل سِب الحساب من هنا ✓
astrelle-sip-used-invalid = أدخل ما يقول مزوّد الخدمة إنك استهلكته، بالجيجا.

## Languages

astrelle-language-offer = قوائم Astrelle ونوافذه متاحة بـ{ $language }. هل تنزّلها (أقل من ١ ميجا)؟
astrelle-language-download = تنزيل
astrelle-language-not-now = ليس الآن
astrelle-language-restart-to = أعد تشغيل Astrelle لإكمال التحويل إلى { $language }.
astrelle-language-restart = إعادة التشغيل
astrelle-language-failed = تعذّر تنزيل اللغة. تحقق من اتصالك، ثم اخترها مجددًا من إعدادات Astrelle.
astrelle-language-system = مثل نظامك ({ $language })
astrelle-language-downloading = جارٍ التنزيل…
astrelle-language-restart-needed = أعد تشغيل Astrelle لتراه بهذه اللغة.
astrelle-media-play = تشغيل
astrelle-media-pause = إيقاف مؤقت
astrelle-media-previous = السابق
astrelle-media-next = التالي
astrelle-media-mute = كتم الصوت
astrelle-media-unmute = إلغاء الكتم
astrelle-media-close = إخفاء حتى يُشغَّل من جديد
astrelle-media-go-to-tab = انتقل إلى اللسان الذي يعرض { $title }
