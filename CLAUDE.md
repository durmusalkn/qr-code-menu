# CLAUDE.md — Anılar (passive memory archive)

Personal "journaling without journaling" app. The app nudges the user a few times a day, the user
answers with almost no effort, memories pile up and are surfaced again months later.

The app **asks, stores and brings back. It never comments, guides, analyses or categorises.**
Memories are stored raw. Recall example: "1 yıl önce bugün Moda'daydın, kendini 😊 (7)
hissediyordun, bu ses kaydını almıştın." No advice, no evaluation.

- Personal use. Target device: **Samsung Galaxy S26+ (Android)**. Keep code cross-platform, but iOS
  is not tested.
- Not going to the store for now, but avoid permissions that store policies frown upon.
- The owner is a software engineer. Decisions below were made together; when something is
  ambiguous, **ask instead of guessing**.

## Hard rules

1. **No backend.** No server, cloud DB or own API. All data lives on the device.
2. **Completely free.** No paid APIs, subscriptions or services requiring API keys. (Open-Meteo is
   keyless and fine.)
3. **No in-app camera.** Photos/videos are taken with Samsung's camera app via
   `expo-image-picker` → `launchCameraAsync`. Do not use `expo-camera`.
4. **No gallery read permission.** Never request `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`,
   `READ_MEDIA_AUDIO` (they are listed in `android.blockedPermissions` in `app.config.ts`). We only
   **write** copies to the gallery. If gallery writing turns out to need broader permissions, tell
   the owner (a small native MediaStore module may be considered).
5. **Audio recording in-app** (`expo-audio`). No transcription.
6. **No AI / categorisation / content analysis.**
7. **Ask before adding any dependency** outside the stack below, and explain why.
8. **Expo APIs change between SDKs** (e.g. `expo-av` → `expo-audio`/`expo-video`,
   `expo-background-fetch` → `expo-background-task`). Check current docs before using an API. See
   "Reading Expo docs" below.
9. No secrets, keys or personal data in the repo (it is shared on GitHub).

## Stack

Current SDK: **Expo SDK 57** (React Native 0.86, React 19.2, TypeScript 6). Development build, not
Expo Go.

- **Core:** Expo, React Native, TypeScript (`strict`), Expo Router, NativeWind 4 (Tailwind 3),
  Zustand
- **Data:** `expo-sqlite` (WAL) + Drizzle ORM (`drizzle-kit` migrations run automatically on app
  start, `useLiveQuery`), `expo-file-system`, `expo-crypto` (UUID), `date-fns` (tr locale)
- **Tracking & notifications:** `expo-location` + `expo-task-manager` (background location, Android
  foreground service), `expo-notifications`, `expo-background-task` (daily jobs),
  `expo-intent-launcher` (open settings screens)
- **Media:** `expo-image-picker` (Samsung Camera), `expo-media-library` (gallery write only),
  `expo-audio` (record + play), `expo-video` (play), `expo-video-thumbnails`
- **Backup/transfer:** `react-native-zip-archive`, `expo-file-system` Storage Access Framework
- **External data:** Open-Meteo (weather), `expo-location` `reverseGeocodeAsync` (address)
- **Quality:** Jest + `jest-expo`, ESLint (`eslint-config-expo` flat) + Prettier
- **Later versions (do not add now):** `@shopify/react-native-skia` (collage), `victory-native`
  (mood chart), MapLibre + OSM (map)

### Stack notes / deviations already agreed or worth knowing

- `react-dom` is pinned to the React version: expo-router's web-only deps pull it in as a peer and
  npm would otherwise pick an incompatible latest. Not shipped in the Android bundle.
- `babel-preset-expo` is a direct devDependency because we have a custom `babel.config.js`
  (NativeWind) and Jest needs to resolve it.
- **`overrides` → `lightningcss` = `lightningcss-wasm@1.27.0` for `react-native-css-interop`.**
  NativeWind 4's css-interop pins `lightningcss@~1.27.0`, which has no `android-arm64` binary, so
  Metro cannot compile `global.css` under Termux (Node reports `process.platform === 'android'`).
  Newer lightningcss versions have the binary but break NativeWind colours (channels multiplied by
  255). The WASM build of the same 1.27.0 engine was verified to produce byte-identical output.
  Remove the override when NativeWind moves to a lightningcss version with an Android binary.

## Development environment

- The owner has **no computer**; everything happens on the phone.
- Builds: **EAS Build** on expo.dev (free plan: 15 Android builds / month — **never waste builds**).
- Live development: Metro in **Termux** on the phone + development build.
- JS-only changes ship without a build via `expo-updates` (EAS Update).
  - `runtimeVersion` uses the `appVersion` policy. **Bump `version` in `app.config.ts` whenever
    native config changes** so OTA updates never reach an incompatible build.
  - Hermes compiler (`hermesc`) has no Android binary, so updates are exported from Termux with
    `--no-bytecode` and uploaded with `eas update --skip-bundler` (`npm run update:preview`).
- No GitHub Actions.
- Claude cannot run Android builds. **Validate every change with `npm run check`**
  (`tsc --noEmit`, ESLint, Jest). `npx expo export --platform android --no-bytecode` is a useful
  extra check that the Metro bundle (Router + NativeWind) compiles.
- When a change touches native config (permissions, plugins, `app.config.ts`, native
  dependencies), **say explicitly that it needs a new EAS build**, and bump `version`.

### Cloud session quirks

- `docs.expo.dev` and `api.expo.dev` may be blocked by the network policy. Read the docs from
  source instead: `https://raw.githubusercontent.com/expo/expo/sdk-57/docs/pages/<path>.mdx`
  (e.g. `versions/unversioned/sdk/notifications.mdx`, `router/installation.mdx`).
- `npx expo install` needs `EXPO_OFFLINE=1` in that case (uses the SDK's bundled version list).

## Data model

General rules:

- All primary keys are **UUID (text)** so imported archives merge without collisions.
- Times are **UTC epoch milliseconds (integer)**; displayed in local time (Europe/Istanbul).
- Media paths are **relative** (`media/2026/10/15/<uuid>.jpg`), never absolute.
- Large files are **never** stored as DB blobs; they live on the file system.
- Location data is kept **forever**; no automatic deletion.
- Index the time columns.

Tables (proposal; reasoned changes are welcome):

- `moments`: `id`, `created_at`, `updated_at`, `note` (nullable), `mood` (1–10, nullable),
  `starred` (bool), `source` (`quick_capture` | `prompt` | `in_app`), `prompt_id` (nullable),
  `lat`, `lng`, `accuracy`, `place_name`, `weather_code`, `temperature_c`
- `media`: `id`, `moment_id`, `kind` (`photo` | `video` | `audio`), `rel_path`, `mime_type`,
  `size_bytes`, `duration_ms`, `width`, `height`, `thumbnail_rel_path`, `gallery_asset_id`
  (nullable), `created_at`
- `location_points`: `id`, `recorded_at`, `lat`, `lng`, `accuracy`, `altitude`, `speed`
- `visits`: `id`, `lat`, `lng`, `place_name`, `arrived_at`, `departed_at`
- `prompts`: `id`, `kind` (`mood` | `activity` | `photo`), `scheduled_for`, `delivered_at`,
  `responded_at`, `response_moment_id`
- `settings`: `key`, `value` (JSON)
- `backup_log`: `id`, `started_at`, `finished_at`, `status`, `files_copied`, `bytes_copied`,
  `error`

## Features

### Onboarding & permissions

Step by step, each with a short "why":

1. Notifications (`POST_NOTIFICATIONS`)
2. Location: first "while using", then on a separate screen "always" (Android grants it from the
   settings page; send the user there)
3. Camera and microphone
4. Battery optimisation exemption (Samsung kills background work aggressively — open the setting
   via `expo-intent-launcher`)
5. Exact alarm (`SCHEDULE_EXACT_ALARM`) if needed
6. Backup folder selection (SAF, once)

A **permission status screen** (also reachable from settings): missing permissions shown in red,
tapping opens the relevant setting.

### Persistent quick-capture notification

- Always in the notification shade if allowed: 📝 Not · 📷 Fotoğraf · 🎙️ Ses (+ ⭐ önemli if
  possible).
- Ideally the **same notification** as the background location foreground service. If
  `expo-location`'s foreground-service notification cannot have action buttons, present options
  (separate sticky notification, or Notifee) with pros/cons to the owner — **owner decides**.
- If swiped away, re-show at a suitable moment.

### Daily random prompts

- **Exactly 3** per day, random times **10:00–22:00**, at least **2 hours** apart.
- Random kind each: `mood` ("Şu an nasıl hissediyorsun?"), `activity` ("Şu an ne yapıyorsun?"),
  `photo` ("Fotoğraf çekmek ister misin?").
- The app may not be opened every day: schedule several days ahead and refresh on every app start
  and in the daily background task. Scheduled prompts are written to `prompts`.
- **Mood:** 3 action buttons 😞 / 😐 / 😄 → store **2 / 5 / 8**, ideally without opening the app.
  Tapping the notification opens the app with the **1–10 emoji picker**.
- **Activity:** opens the app on the note screen (note or voice recording).
- **Photo:** opens Samsung Camera directly.
- No separate location-based notification.

### Mood scale

Stored as 1–10, shown as emoji. Default mapping (single constants file):
1 😭 · 2 😢 · 3 😞 · 4 🙁 · 5 😐 · 6 🙂 · 7 😊 · 8 😄 · 9 😁 · 10 🤩

### Capture

- Every capture creates a **moment**; current location, address and weather are attached
  automatically (if unavailable the moment is still saved with empty fields).
- A moment can have multiple media.
- **Photo/video:** `launchCameraAsync` → file moved into the app's `media/` folder (master copy) →
  **copy written to the gallery** (ideally album "Anılarım").
- **Audio:** in-app recording, high quality (AAC, 48 kHz).
- **Note:** plain text.
- Saved automatically when capture finishes; no confirmation step.

### Background location & visits

- Android foreground service, continuous location; battery-friendly settings (balanced accuracy,
  sensible distance/time intervals — propose values).
- Raw points into `location_points`, unlimited.
- Visit detection: staying within ~150 m for more than 15 minutes → `visits` (values are tunable
  constants).

### Timeline

- Day list (newest first): moments, mood, media thumbnails per day.
- Day detail: moments chronologically, photo viewer, video and audio playback, visited places.

### "On this day" recall

- Screen showing moments from **1 month, 6 months, 1 year and earlier years** ago today.
- At most **1** reminder notification per day if such a memory exists (not counted in the 3
  random prompts; can be turned off in settings).
- Text like "1 yıl önce bugün Moda'daydın, kendini 😊 (7) hissediyordun." No comment, advice or
  evaluation.
- "O gün böyleydin, bugün nasılsın?" may link to the mood picker.

### Automatic backup

- **Requires no user action.** A visible folder on the phone (e.g. `Documents/Anılar`) chosen once
  during onboarding via SAF.
- Daily background job: consistent DB copy (`VACUUM INTO`) + **only new** media files
  (incremental).
- Result written to `backup_log`; last backup time visible in settings.

### Export / import

- **Export:** one ZIP → `manifest.json` (schema version, app version, date, file counts and sizes)
  - database (or JSON dump — propose) + `media/YYYY/MM/DD/...`.
- **Import:** manifest and file validation, schema-version migration, **merge by UUID** (no
  duplicates), progress indicator, does not block the UI for large archives.
- Goal: move the whole archive when changing phones (possibly to iPhone later).

### Settings

- Permission status screen
- Notification time window and count (default 10–22, 3)
- "On this day" reminder on/off
- Storage usage (photo / video / audio / database separately)
- Backup folder and last backup info
- Export / import
- **Delete memories** (by date range and all; double confirmation)

## Code structure and conventions

```
app/                    # Expo Router screens (routes only)
src/
  db/                   # Drizzle schema, client, migrations
  features/
    onboarding/
    capture/
    mood/
    timeline/
    recall/
    location/
    notifications/
    backup/
    settings/
  components/           # shared UI
  lib/                  # helpers (dates, file paths, uuid…)
  i18n/tr.ts            # all UI strings (Turkish)
```

- UI strings are **Turkish** and live in `src/i18n/tr.ts`; code, identifiers, comments and commit
  messages are **English**.
- Import alias: `@/…` → `src/…`.
- DB access only through layers like `features/*/repository.ts`; no SQL in components.
- Pure logic (notification scheduling, visit detection, "on this day" queries, manifest
  validation, mood mapping) is kept free of native dependencies and **tested with Jest**.
- Conventional Commits; each phase in small, separate commits.
- Styling with NativeWind `className`.

## Phases

At the end of each phase **stop**: summarise what was done, how it was verified, and whether a new
EAS build is needed; wait for approval.

- [x] **Phase 0 – Setup:** Expo project, TS strict, Expo Router, NativeWind, Zustand,
      ESLint/Prettier, Jest, `app.config.ts`, `eas.json`, `expo-updates`, `CLAUDE.md`, `README.md`.
- [ ] **Phase 1 – Data layer:** Drizzle schema, migrations, WAL, repositories, mood mapping, tests.
- [ ] **Phase 2 – Onboarding & permissions:** permission flow, status screen, backup folder.
- [ ] **Phase 3 – Capture:** note, mood picker, audio, Samsung Camera photo/video, gallery copy,
      location + address + weather.
- [ ] **Phase 4 – Timeline:** day list, day detail, media playback.
- [ ] **Phase 5 – Background location:** foreground service, points, visit detection.
- [ ] **Phase 6 – Notifications:** persistent quick-capture, 3 random prompts, mood buttons.
- [ ] **Phase 7 – On this day:** screen and daily reminder.
- [ ] **Phase 8 – Backup & transfer:** automatic incremental backup, ZIP export/import.
- [ ] **Phase 9 – Settings:** storage usage, delete memories, notification settings.
