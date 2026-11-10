# مشروع Android WebView لتطبيق Storybook Flipbook

هذا المجلد يحتوي على مشروع أندرويد خفيف جاهز للبناء عبر **Android Studio** أو **AndroidIDE** لتحويل موقع التطبيق على Netlify إلى ملف APK.

## خطوات سريعة قبل البناء

1. افتح الملف:
   `app/src/main/res/values/strings.xml`
2. استبدل `https://YOUR-NETLIFY-SITE.netlify.app` برابط موقعك الفعلي على Netlify.
3. افتح مجلد `android-webview` في **Android Studio** (أو في **AndroidIDE** على هاتفك)، ثم اختر:
   - **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** (في Android Studio).
   - أو زر **Run / Build APK** في AndroidIDE.

## المزايا المدمجة
- شاشة بداية (Splash Screen) بأيقونة Storybook وهوية القسم.
- صلاحيات الإنترنت (`INTERNET` و `ACCESS_NETWORK_STATE`).
- دعم رفع ملفات PDF والصوت والصور من لوحة المعلم داخل التطبيق.
- دعم عرض ملء الشاشة (Fullscreen)، تحميل الملفات، وفتح مشاركة واتساب مباشرة.
