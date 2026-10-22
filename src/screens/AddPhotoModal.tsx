import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { DateField } from '../components/DateField';
import { dayFromExif, DayKey, todayKey } from '../lib/dates';
import { NewPhoto, usePhotos } from '../state/PhotosContext';
import { colors, radius, spacing } from '../theme';

type Props = {
  initialDay?: DayKey;
  onClose: () => void;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  exif: true,
};

export function AddPhotoModal({ initialDay, onClose }: Props) {
  const { addPhotos } = usePhotos();
  const [day, setDay] = useState<DayKey>(initialDay ?? todayKey());
  const [useExifDate, setUseExifDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (assets: ImagePicker.ImagePickerAsset[], fromGallery: boolean) => {
    const items: NewPhoto[] = assets.map((asset) => ({
      uri: asset.uri,
      day: (fromGallery && useExifDate && dayFromExif(asset.exif)) || day,
      width: asset.width || null,
      height: asset.height || null,
    }));
    setSaving(true);
    try {
      await addPhotos(items);
      onClose();
    } catch (e) {
      Alert.alert('Fotoğraf kaydedilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kamera izni gerekli', 'Fotoğraf çekebilmek için ayarlardan kamera iznini açın.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) await save(result.assets, false);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...PICKER_OPTIONS,
      allowsMultipleSelection: true,
      orderedSelection: true,
    });
    if (!result.canceled) await save(result.assets, true);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Fotoğraf ekle</Text>
          <Text style={styles.subtitle}>
            Fotoğraflar seçtiğin güne kaydedilir. Geçmiş günler için de ekleyebilirsin.
          </Text>
        </View>

        <DateField label="Gün" value={day} onChange={setDay} />

        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Fotoğrafın çekildiği tarihi kullan</Text>
            <Text style={styles.optionHint}>
              Galeriden toplu eklerken her fotoğraf kendi çekim tarihine kaydedilir. Tarih bilgisi
              olmayanlar yukarıdaki güne eklenir.
            </Text>
          </View>
          <Switch
            value={useExifDate}
            onValueChange={setUseExifDate}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.actions}>
          <Button title="Kamera ile çek" onPress={takePhoto} loading={saving} />
          <Button title="Galeriden seç" variant="secondary" onPress={pickFromGallery} disabled={saving} />
          <Button title="Vazgeç" variant="secondary" onPress={onClose} disabled={saving} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs, marginTop: spacing.md },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  optionText: { flex: 1, gap: spacing.xs },
  optionTitle: { color: colors.text, fontWeight: '600' },
  optionHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  actions: { gap: spacing.md, marginTop: 'auto' },
});
