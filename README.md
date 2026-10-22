# Gelişim Günlüğü

Spordaki gelişimini görmek için her gün bir fotoğraf ekle; uygulama bu fotoğrafları ilk günden son güne sıralayıp tek bir videoya dönüştürsün.

- **Tamamen offline:** Fotoğraflar uygulamanın kendi klasörüne kopyalanır, kayıtlar cihazdaki SQLite veritabanında tutulur. İnternet gerekmez.
- **Gün bazında kayıt:** Her fotoğraf, eklerken seçtiğin güne kaydedilir. Geçmiş günler için de fotoğraf ekleyebilirsin.
- **Toplu geçmiş ekleme:** Galeriden birden fazla fotoğraf seçip "Fotoğrafın çekildiği tarihi kullan" seçeneğiyle her birini kendi çekim gününe (EXIF) kaydedebilirsin.
- **Video:** Fotoğraflar kronolojik sırayla MP4 videoya dönüştürülür (720p / 1080p, fotoğraf başına süre ayarlanabilir, isteğe bağlı "Gün 12 · 05.03.2026" yazısı). Video cihaz üzerinde Android `MediaCodec` ile üretilir; galeriye kaydedilebilir veya paylaşılabilir.

> Eski QR Menü projesi `qr-code-menu-backup` branch'inde duruyor.

## Teknolojiler

- React Native + [Expo](https://expo.dev) (SDK 58), TypeScript
- `expo-sqlite` — yerel veritabanı
- `expo-file-system` — fotoğraf ve video dosyaları
- `expo-image-picker` — kamera / galeri
- `expo-video`, `expo-media-library`, `expo-sharing` — önizleme, galeriye kaydetme, paylaşma
- `modules/timelapse-encoder` — fotoğrafları MP4'e çeviren yerel Kotlin modülü (Expo Modules API)

## Çalıştırma

Uygulama özel bir native modül içerdiği için **Expo Go ile çalışmaz**; development build gerekir.

### Bilgisayarda (Android Studio ile)

Gereksinimler: Node.js 20+, Android Studio (Android SDK + JDK 17), USB hata ayıklaması açık bir telefon veya emülatör.

```bash
npm install
npm run android        # = npx expo run:android
```

İlk çalıştırmada `android/` klasörü otomatik üretilir (git'e eklenmez).

### Bulutta APK üretmek (Android Studio olmadan)

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Build bittiğinde verilen bağlantıdan APK'yı telefona indirip kurabilirsin.

## Geliştirme

```bash
npm test            # birim testleri (tarih hesapları, sıralama, video kareleri)
npm run typecheck   # TypeScript kontrolü
npm run lint        # ESLint
```

## Proje yapısı

```
App.tsx                         Sekmeler (Günlük / Video), SQLite ve state sağlayıcıları
src/db/photos.ts                Şema, migration'lar ve sorgular
src/lib/dates.ts                Gün anahtarları (YYYY-MM-DD), Türkçe tarih formatları, EXIF tarihi
src/lib/video.ts                Kronolojik sıralama, kare etiketleri, video ayarları
src/lib/storage.ts              Fotoğraf / video dosyalarının yönetimi
src/state/PhotosContext.tsx     Fotoğraf listesi ve ekleme / taşıma / silme işlemleri
src/screens/                    Günlük, fotoğraf ekleme, fotoğraf detayı ve video ekranları
modules/timelapse-encoder/      Kotlin video encoder (MediaCodec + MediaMuxer)
```

### Veri modeli

`photos` tablosu: `id`, `day` (`YYYY-MM-DD`, yerel gün), `file_name` (uygulama belgeler klasöründeki `photos/` altında), `width`, `height`, `created_at`. Aynı güne birden fazla fotoğraf eklenebilir; videoda gün sırasına, aynı gün içinde ekleme sırasına göre yer alırlar.
