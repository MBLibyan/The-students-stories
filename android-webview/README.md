# Android WebView Wrapper — Storybook Flipbook

This folder contains a lightweight Android Studio / AndroidIDE project that wraps the deployed Netlify site into an installable Android APK.

## Quick Build Steps

1. Open `app/src/main/res/values/strings.xml`.
2. Replace `https://YOUR-NETLIFY-SITE.netlify.app` with your live Netlify deployment URL.
3. Open the `android-webview` directory in **Android Studio** or **AndroidIDE**, then run **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.

## Included Features
- Branded Splash Screen with Storybook launcher icons.
- `INTERNET` and `ACCESS_NETWORK_STATE` permissions.
- Native file chooser support (`onShowFileChooser`) so teachers can upload PDFs, audio, and covers inside the app.
- Fullscreen mode support, file downloads via `DownloadManager`, and WhatsApp share link handling.
