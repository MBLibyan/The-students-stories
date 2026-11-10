# Storybook Flipbook — Interactive English Reading Library

A mobile-first Progressive Web App (**PWA**) built for **university English-department students**, offering a realistic page-flipping reading experience, synchronized audio narration, and interactive comprehension & inference quizzes — all in a clean English interface.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MBLibyan/The-students-stories)

---

## Features

### Student Flipbook Viewer (`/book/:id` — Public, No Login Required)
- **Realistic Page-Flip Animation (`StPageFlip` + `pdf.js`):**
  - Page sequence: **Front Cover → PDF Story Pages → Interactive Quick Check Quiz → Back Cover**.
  - **Lazy PDF Rendering:** Streams large PDFs and renders only a sliding window around the current page, evicting distant pages from memory on mobile devices.
  - Supports touch swipe, Next/Previous buttons, keyboard arrows, and **View Fullscreen**.
- **Audio Player Bar:** Play/Pause, seek bar, duration readout, and **`0.75x` / `1x` / `1.25x`** playback speeds.
- **Interactive Quick Check Quiz:**
  - Supports **Multiple Choice** and **Inference** questions.
  - Toggle between **One by one** and **All together** modes.
  - Instant green/red visual feedback, optional explanation reveal, final score breakdown, and **Try again**.
- **Download & Share:** Download the original story PDF and audio track, or share via Web Share API, Copy Link, and WhatsApp.
- **Dark / Light Mode** and installable Android PWA (`manifest.json`, `sw.js`, icons).

### Teacher Portal (`/admin` — Supabase Username/Password Login)
- Sign in cleanly with a **Username** (such as `admin`) and **Password**.
- Upload story PDF (with automatic page-count verification).
- Upload audio narration (MP3 / M4A / WAV) with inline preview.
- Upload front cover and back cover images.
- Quiz Question Builder supporting add, edit, delete, and reorder for Multiple Choice and Inference questions.
- Published Books list with **View**, **Download PDF**, **Download Audio**, **Share**, **Edit**, and **Delete**.

---

## 1. Supabase Database & Storage Setup

1. Create a standalone Supabase project for your English-department stories.
2. Open **SQL Editor → New query**, paste the contents of `supabase/migrations/001_initial_schema.sql`, and click **Run**.
3. Create an Admin/Teacher user under **Authentication → Users → Add user → Create new user**:
   - **Email:** `<username>@storybook.local` (for example, `admin@storybook.local` so you can sign in on `/admin` using just `admin`).
   - **Password:** your chosen password.
   - Enable **Auto Confirm User** before clicking **Create user**.
4. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

---

## 2. Local Development

```bash
npm install
cp .env.example .env
```

Set your Supabase keys in `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Run locally:

```bash
npm run dev
```

*(Without Supabase env vars configured, the app runs in Demo Mode with a bundled sample story.)*

---

## 3. Deploy to Netlify

`netlify.toml` is already configured for Vite build (`npm run build` → `dist`), SPA routing (`/* → /index.html`), and PWA caching headers.

1. Open [Netlify](https://app.netlify.com/) → **Add new site → Import an existing project** → choose GitHub repository `MBLibyan/The-students-stories` (`main` branch).
2. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Click **Deploy site**.

---

## 4. Install as Android PWA & Build APK (`/android-webview`)

- **PWA:** Open the live Netlify URL in Chrome on Android and tap **Install App** (or Chrome menu `⋮` → **Install app**).
- **APK:** Edit `android-webview/app/src/main/res/values/strings.xml` (`app_url`), open `/android-webview` in **Android Studio** or **AndroidIDE**, and build the APK.

---

## Verification

```bash
npm test
npm run build
```
