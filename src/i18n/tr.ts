/**
 * All user-facing strings live here (Turkish).
 * Code, identifiers and comments stay in English.
 */
export const tr = {
  app: {
    name: 'Anılar',
  },
  home: {
    title: 'Anılar',
    subtitle: 'Günlük tutmadan günlük tut.',
    permissionsLink: 'İzin durumu',
    missingPermissions: (count: number) => `${count} izin eksik`,
  },
  capture: {
    actions: {
      note: 'Not',
      mood: 'Ruh hali',
      photo: 'Fotoğraf',
      video: 'Video',
      audio: 'Ses',
    },
    saved: 'Kaydedildi',
    saveFailed: 'Kaydedilemedi. Tekrar dener misin?',
    cameraPermission: 'Kamera izni yok. İzin durumu ekranından verebilirsin.',
    cameraFailed: 'Kamera açılamadı.',
    done: 'Bitti',
    star: 'Önemli',
    note: {
      title: 'Not',
      placeholder: 'Şu an ne yapıyorsun?',
    },
    mood: {
      title: 'Ruh hali',
      question: 'Şu an nasıl hissediyorsun?',
    },
    audio: {
      start: '🎙️  Ses kaydı başlat',
      stop: (elapsed: string) => `■  Durdur  ${elapsed}`,
      saved: (duration: string) => `🎙️ Ses kaydı (${duration}) kaydedildi`,
      errors: {
        permission: 'Mikrofon izni yok. İzin durumu ekranından verebilirsin.',
        failed: 'Ses kaydı başlatılamadı.',
      },
    },
  },
  database: {
    errorTitle: 'Veritabanı açılamadı',
  },
  common: {
    continue: 'Devam',
    skip: 'Şimdilik geç',
    back: 'Geri',
  },
  onboarding: {
    progress: (current: number, total: number) => `${current} / ${total}`,
    finish: 'Başla',
    doneTitle: 'Hazırsın',
    doneBody:
      'Eksik bıraktığın izinleri istediğin zaman izin durumu ekranından verebilirsin. Ekranda kırmızı görünürler.',
    steps: {
      notifications: {
        title: 'Bildirimler',
        body: 'Gün içinde birkaç kez kısa bir soru sorarım: nasıl hissettiğini, ne yaptığını. Cevaplamak birkaç saniye sürer; bildirimler olmadan sana ulaşamam.',
        action: 'Bildirimlere izin ver',
      },
      location: {
        title: 'Konum',
        body: 'Her anıya nerede olduğunu ve o anki havayı eklerim. Yer adı için “hassas konum” gerekiyor; yaklaşık konum yeterli olmuyor.',
        action: 'Konuma izin ver',
      },
      backgroundLocation: {
        title: 'Konum: her zaman',
        body: 'Uygulama kapalıyken de gittiğin yerleri kaydederim; aylar sonra “o gün neredeydin” sorusunun cevabı buradan gelir. Açılan ayarlar ekranında “Her zaman izin ver”i seç.',
        action: 'Ayarlarda “Her zaman”ı seç',
      },
      media: {
        title: 'Kamera ve mikrofon',
        body: 'Fotoğraf ve videoları telefonun kendi kamerasıyla çekersin; ses kayıtlarını uygulama içinde alırım. İkisi için de izin gerekiyor.',
        action: 'Kamera ve mikrofona izin ver',
      },
      battery: {
        title: 'Pil optimizasyonu',
        body: 'Samsung arka plandaki uygulamaları kapatabiliyor; o zaman konum ve yedekleme durur. Açılan listede “Anılar” için pil optimizasyonunu kapat. Ayrıca Ayarlar › Pil bölümündeki arka plan kullanım sınırlarında Anılar’ı hiç uyutulmayan uygulamalara eklemen iyi olur.',
        action: 'Pil ayarlarını aç',
      },
      backupFolder: {
        title: 'Yedek klasörü',
        body: 'Her gün anılarını telefonda görünür bir klasöre kendiliğinden yedeklerim. Belgeler içinde “Anılar” adında bir klasör oluşturup onu seçmeni öneririm. Bunu bir kez yaparsın.',
        action: 'Klasör seç',
      },
    },
  },
  permissions: {
    title: 'İzin durumu',
    subtitle: 'Kırmızı olanlara dokunarak izin verebilirsin.',
    allGranted: 'Tüm izinler tamam.',
    names: {
      notifications: 'Bildirimler',
      location: 'Konum (hassas)',
      backgroundLocation: 'Konum: her zaman',
      camera: 'Kamera',
      microphone: 'Mikrofon',
      batteryOptimization: 'Pil optimizasyonu muafiyeti',
      backupFolder: 'Yedek klasörü',
    },
    states: {
      granted: 'Tamam',
      undetermined: 'Verilmedi',
      denied: 'Reddedildi',
      blocked: 'Ayarlardan verilmeli',
      unknown: 'Okunamadı',
    },
    hints: {
      request: 'Dokun: izin iste',
      openSettings: 'Dokun: ayarları aç',
      pickFolder: 'Dokun: klasör seç',
    },
  },
  notifications: {
    channels: {
      prompts: 'Günlük sorular',
    },
  },
} as const;
