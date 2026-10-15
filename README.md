# Anılar

Kişisel, pasif bir anı arşivi: **günlük tutmadan günlük tutmak.** Uygulama gün içinde dürter,
neredeyse hiç çaba harcamadan cevap verirsin; anılar cihazında birikir ve aylar sonra sana geri
getirilir. Sunucu yok, ücretli servis yok, yapay zekâ yok — tüm veri telefonda.

Ürün kuralları, veri modeli ve faz planı için bkz. [`CLAUDE.md`](./CLAUDE.md).

> Not: Bu repo daha önce bir QR menü projesini barındırıyordu; o proje
> [`qr_code_menu`](../../tree/qr_code_menu) branch'inde duruyor.

## Teknoloji

Expo SDK 57 (development build) · React Native 0.86 · TypeScript (strict) · Expo Router ·
NativeWind 4 · Zustand · Jest (`jest-expo`) · ESLint + Prettier · EAS Build + EAS Update.

## Komutlar

| Komut                    | Ne yapar                                                                   |
| ------------------------ | -------------------------------------------------------------------------- |
| `npm start`              | Metro'yu development build için başlatır                                   |
| `npm run start:local`    | Metro'yu sadece `localhost` üzerinden başlatır (Termux + aynı telefon)     |
| `npm run check`          | `tsc --noEmit` + ESLint + Jest + migration paketi kontrolü                 |
| `npm run typecheck`      | Sadece TypeScript kontrolü                                                 |
| `npm run lint`           | ESLint (Prettier kuralları dahil)                                          |
| `npm test`               | Jest testleri                                                              |
| `npm run format`         | Prettier ile tüm dosyaları biçimlendirir                                   |
| `npm run db:generate`    | Şema değişikliğinden sonra migration üretir ve uygulamaya paketler         |
| `npm run build:dev`      | EAS'ta development client APK'sı (`Anılar (Dev)`)                          |
| `npm run build:preview`  | EAS'ta kurulabilir APK (`Anılar`)                                          |
| `npm run update:preview` | JS değişikliklerini build almadan `preview` kanalına gönderir (EAS Update) |

## Telefondan kurulum (Termux + EAS)

Bilgisayar gerekmez. Native derleme expo.dev sunucularında (EAS Build) yapılır; telefonda sadece
Node, Metro ve EAS CLI çalışır.

### 1. Termux

1. Termux'u **F-Droid**'den ya da GitHub sürümlerinden kur (Play Store sürümü eski).
2. Paketleri kur:

   ```sh
   pkg update && pkg upgrade
   pkg install nodejs-lts git
   ```

3. Uzun süren işlemlerde Samsung'un Termux'u öldürmemesi için: `termux-wake-lock` (ve Termux'u pil
   optimizasyonundan muaf tut).

### 2. Projeyi al

```sh
git clone https://github.com/durmusalkn/qr-code-menu.git anilar
cd anilar
npm ci
```

### 3. EAS hesabı ve proje kimliği (bir kerelik)

```sh
npm install --global eas-cli
eas login
eas init
```

`eas init` bir proje kimliği (UUID) üretir. Yapılandırma dinamik (`app.config.ts`) olduğu için
kimliği otomatik yazamaz; `app.config.ts` içindeki `EAS_PROJECT_ID` sabitine yapıştır ve commit'le.
Bu kimlik gizli değildir. Kimlik girildiğinde `expo-updates` adresi (`https://u.expo.dev/<id>`)
otomatik ayarlanır.

### 4. Development build (native değişiklik oldukça)

```sh
npm run build:dev
```

Build bitince expo.dev'deki sayfadan APK'yı indirip kur ("bilinmeyen kaynaklar" izni gerekir).
Uygulama **Anılar (Dev)** adıyla, ayrı paket kimliğiyle (`…anilar.dev`) kurulur; böylece preview
sürümüyle yan yana durabilir.

> Ücretsiz planda ayda 15 Android build hakkı var. Sadece native yapılandırma değiştiğinde
> (izin, plugin, native bağımlılık, `app.config.ts`) yeni build gerekir.

### 5. Canlı geliştirme

```sh
npm run start:local
```

Sonra **Anılar (Dev)** uygulamasını aç; `http://localhost:8081` sunucusunu listeden seç (görünmezse
adresi elle gir). JS değişiklikleri anında yansır.

### 6. Kurulabilir sürüm ve build'siz güncellemeler

```sh
npm run build:preview     # "Anılar" APK'sı
npm run update:preview    # sonraki JS değişikliklerini OTA gönder
```

- `runtimeVersion` politikası `appVersion`. **Native yapılandırma her değiştiğinde
  `app.config.ts`'teki `version`'ı artır** ve yeni build al; böylece uyumsuz bir JS güncellemesi
  eski build'e asla gitmez.
- Hermes derleyicisinin Android (Termux) için ikilisi olmadığından `update:preview` önce
  `expo export --no-bytecode` ile paketi üretir, sonra `eas update --skip-bundler` ile yükler.
  Uygulama düz JS paketini de çalıştırır (açılış biraz daha yavaş olabilir).

## Termux uyumluluk notları

- **NativeWind / lightningcss:** NativeWind 4'ün bağımlılığı `react-native-css-interop`,
  `lightningcss@1.27.0`'a sabitlenmiş ve bu sürümün Android ikilisi yok. `package.json`'daki
  `overrides`, aynı sürümün WebAssembly derlemesini (`lightningcss-wasm@1.27.0`) kullandırır;
  çıktının native sürümle birebir aynı olduğu doğrulandı.
- Watchman gerekmez; Metro Node'un dosya izleyicisini kullanır.
- Testler Node'un yerleşik `node:sqlite` modülünü kullanır: Termux'taki `nodejs-lts` en az
  **22.16** olmalı (`node -v`).

## Klasör yapısı

```
app/            Expo Router ekranları
src/
  db/           Drizzle şeması, client, migration'lar
  features/     özellik modülleri (onboarding, capture, mood, timeline, recall, …)
  components/   paylaşılan arayüz bileşenleri
  lib/          yardımcılar
  i18n/tr.ts    tüm arayüz metinleri (Türkçe)
```

## Lisans

MIT — bkz. [`LICENSE`](./LICENSE).
