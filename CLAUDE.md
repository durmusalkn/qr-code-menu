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
- **Drizzle 0.45 (stable), not the 1.0 RC** that drizzle's docs now show. Migrations are generated
  without `driver: 'expo'` and bundled into `src/db/migrations.generated.ts` by
  `scripts/bundle-migrations.js`, so no `babel-plugin-inline-import` / `.sql` Metro extension is
  needed. `npm run check` fails if the bundle is stale.
- **Repository tests run against real SQLite** via Node's built-in `node:sqlite`, wrapped in a tiny
  adapter (`src/db/testing/nodeSqliteConnection.ts`) that mimics the expo-sqlite API drizzle's expo
  driver uses. Same driver, dialect, migrator and SQL as on the device; no extra dependency. Needs
  Node ≥ 22.16 (`setReturnArrays`, `columns`).
- **`expo-battery`** (owner-approved addition) reads the battery-optimisation exemption for the
  permission status screen.
- **Native modules for later phases are already installed** (owner-approved, to save EAS builds):
  `expo-task-manager`, `expo-background-task`, `expo-media-library`, `expo-video`,
  `expo-video-thumbnails`, `react-native-zip-archive`, plus `expo-audio`, `expo-image-picker`,
  `expo-file-system`. Their plugins are configured in `app.config.ts`. Using them needs no new
  build unless their plugin options change.
- `expo-asset` is a direct dependency pinned to SDK 57: `expo-audio` peers on `expo-asset@*` and
  npm otherwise installs the next SDK's version, which breaks Metro bundling.

### Android permissions (as configured)

- Requested at runtime: notifications, precise location, background location, camera,
  microphone. Approximate location counts as not granted (place names and visits need precise).
- Gallery: `expo-media-library` writes on Android 13+ **without any permission**; its plugin is
  set to `granularPermissions: []` and every `READ_MEDIA_*` / `READ_EXTERNAL_STORAGE` /
  `ACCESS_MEDIA_LOCATION` is in `blockedPermissions`. Looking up albums needs read permission,
  so album handling must work from what the app itself created (Phase 3).
- **No `SCHEDULE_EXACT_ALARM`**: expo-notifications falls back to inexact
  `setAndAllowWhileIdle`, fine for prompts at random times; the permission is store-restricted.
- **No `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** (store-restricted): onboarding opens the
  battery-optimisation list screen instead.
- `SYSTEM_ALERT_WINDOW` (template default) is blocked.
- `expo-audio` / `expo-video` background playback and background recording are off.
- Check the generated manifest by running `npx expo prebuild --platform android --no-install` in
  a scratch copy of the repo (never commit `android/`).

### Capture (as implemented)

- **Save first, enrich later.** A capture is written immediately (no confirmation); location,
  place name (`reverseGeocodeAsync`, shortened like "Caferağa, Kadıköy") and weather (Open-Meteo)
  are added in the background by `enrichMomentContext`. Each part has a timeout and is simply
  left empty when it fails (offline, no permission, no fix). A later backfill (e.g. Open-Meteo's
  historical API) is possible but not built.
- Photo/video: `launchCameraAsync` with `quality: 1` (original file, no re-encode) → file moved to
  `media/YYYY/MM/DD/<mediaId>.<ext>` → moment + media inserted in one transaction (files are
  rolled back if that fails) → gallery copy in the background. Video thumbnails via
  `expo-video-thumbnails`. Results delivered after Android killed the app while the camera was open
  are recovered via `getPendingResultAsync()` on the home screen.
- Gallery: SDK 57's `expo-media-library` default export is the new object API (`Asset.create`,
  `Album.create`); the old functions (`createAssetAsync`, …) throw at runtime. The album
  "Anılarım" (Pictures/Anılarım) is created by the first copy and its id kept in settings
  (`galleryAlbumId`); later copies go into it with `Asset.create(file, album)`. The first copy's
  asset id is not reported, so its `gallery_asset_id` stays null.
- Audio: in-app `expo-audio` recording, AAC/.m4a, 48 kHz, 128 kbps. Recordings stop and are saved
  when leaving the screen or when the app goes to the background (no background mic).
- Note screen = text + any number of recordings + ⭐ for one moment; the moment is created lazily
  (nothing is saved for an empty draft). Mood picker saves on a single tap.
- Capture routes take `source` / `promptId` params (`parseCaptureOrigin`), so prompt
  notifications (Phase 6) can open them; a prompt is marked responded when its moment is created.

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
  (`tsc --noEmit`, ESLint, Jest, migration bundle up to date). `npx expo export --platform android
--no-bytecode` is a useful extra check that the Metro bundle (Router + NativeWind) compiles.
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

As implemented (`src/db/schema.ts`), with these reasoned additions:

- `prompts.notification_id`: the OS notification id, needed to cancel prompts when re-planning.
- `visits.departed_at` is null while a visit is ongoing.
- `media.moment_id` → `moments.id` `ON DELETE CASCADE`; `media.rel_path` is unique.
- `moments.prompt_id` and `prompts.response_moment_id` have **no** FK constraint: the two tables
  point at each other and import must be able to insert either first.
- CHECK constraints guard `mood` (1–10) and the enum columns, so imported data cannot bypass them.
- `backup_log.status`: `running` | `success` | `error`.
- Schema changes: edit `schema.ts`, then `npm run db:generate` (drizzle-kit + bundling). Note that
  drizzle's migrator wraps all migrations in one transaction, so `PRAGMA foreign_keys` inside a
  migration has no effect.

## Features

### Onboarding & permissions

Step by step, each with a short "why":

1. Notifications (`POST_NOTIFICATIONS`)
2. Location: first "while using", then on a separate screen "always" (Android grants it from the
   settings page; send the user there)
3. Camera and microphone
4. Battery optimisation exemption (Samsung kills background work aggressively — open the setting
   via `expo-intent-launcher`)
5. ~~Exact alarm (`SCHEDULE_EXACT_ALARM`) if needed~~ — not needed, see "Android permissions"
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
  db/                   # Drizzle schema, client, migrations, test database
  features/
    moments/            # moments + media repository (shared by capture, timeline, recall)
    onboarding/         # onboarding flow + permission model/service/status screen
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
- `app/` route files stay thin and re-export screens from `src/features/*`.
- Permission reads/requests go through `src/features/onboarding/permissionService.ts` (native) and
  the pure model in `permissions.ts`; UI uses the Zustand `usePermissionStatuses()` hook, which
  re-reads statuses whenever the app returns to the foreground.
- DB access only through layers like `features/*/repository.ts`; no SQL in components.
  Repositories are factories (`createXRepository(db, deps)`) so tests can inject a test database,
  ids and a clock. Production code passes `db` from `@/db/client`.
- Migrations run once per JS runtime via `migrateDatabase()` (`useDatabase()` in the root layout).
  Background tasks that may start without the UI must `await migrateDatabase()` first.
- Pure logic (notification scheduling, visit detection, "on this day" queries, manifest
  validation, mood mapping) is kept free of native dependencies and **tested with Jest**.
- Conventional Commits; each phase in small, separate commits.
- Styling with NativeWind `className`.

## Phases

At the end of each phase **stop**: summarise what was done, how it was verified, and whether a new
EAS build is needed; wait for approval.

- [x] **Phase 0 – Setup:** Expo project, TS strict, Expo Router, NativeWind, Zustand,
      ESLint/Prettier, Jest, `app.config.ts`, `eas.json`, `expo-updates`, `CLAUDE.md`, `README.md`.
- [x] **Phase 1 – Data layer:** Drizzle schema, migrations, WAL, repositories, mood mapping, tests.
- [x] **Phase 2 – Onboarding & permissions:** permission flow, status screen, backup folder.
- [x] **Phase 3 – Capture:** note, mood picker, audio, Samsung Camera photo/video, gallery copy,
      location + address + weather.
- [ ] **Phase 4 – Timeline:** day list, day detail, media playback.
- [ ] **Phase 5 – Background location:** foreground service, points, visit detection.
- [ ] **Phase 6 – Notifications:** persistent quick-capture, 3 random prompts, mood buttons.
- [ ] **Phase 7 – On this day:** screen and daily reminder.
- [ ] **Phase 8 – Backup & transfer:** automatic incremental backup, ZIP export/import.
- [ ] **Phase 9 – Settings:** storage usage, delete memories, notification settings.
