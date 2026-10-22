import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { DateField } from '../components/DateField';
import type { Photo } from '../db/photos';
import { formatDay, formatWeekday } from '../lib/dates';
import { photoFile } from '../lib/storage';
import { usePhotos } from '../state/PhotosContext';
import { colors, spacing } from '../theme';

type Props = {
  photo: Photo;
  onClose: () => void;
};

export function PhotoModal({ photo, onClose }: Props) {
  const { movePhoto, deletePhoto } = usePhotos();
  const [editingDay, setEditingDay] = useState(false);

  const confirmDelete = () => {
    Alert.alert('Fotoğrafı sil', 'Bu fotoğraf kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(photo);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{formatDay(photo.day)}</Text>
          <Text style={styles.subtitle}>{formatWeekday(photo.day)}</Text>
        </View>

        <Image source={{ uri: photoFile(photo.fileName).uri }} style={styles.image} contentFit="contain" />

        {editingDay ? (
          <DateField
            label="Yeni gün"
            value={photo.day}
            onChange={async (day) => {
              await movePhoto(photo.id, day);
              setEditingDay(false);
              onClose();
            }}
          />
        ) : (
          <View style={styles.actions}>
            <Button title="Günü değiştir" variant="secondary" onPress={() => setEditingDay(true)} style={styles.flex} />
            <Button title="Sil" variant="danger" onPress={confirmDelete} style={styles.flex} />
          </View>
        )}
        <Button title="Kapat" variant="secondary" onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg },
  header: { gap: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted },
  image: { flex: 1, backgroundColor: '#000', borderRadius: 12 },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
