import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import type { Photo } from '../db/photos';
import { DayKey, formatDay, formatDayShort, formatWeekday } from '../lib/dates';
import { DayGroup, groupByDay } from '../lib/grouping';
import { photoFile } from '../lib/storage';
import { usePhotos } from '../state/PhotosContext';
import { colors, radius, spacing } from '../theme';
import { AddPhotoModal } from './AddPhotoModal';
import { PhotoModal } from './PhotoModal';

export function TimelineScreen() {
  const { photos, loading } = usePhotos();
  const groups = useMemo(() => groupByDay(photos), [photos]);
  const [adding, setAdding] = useState<{ day?: DayKey } | null>(null);
  const [selected, setSelected] = useState<Photo | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.day}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Summary groups={groups} photoCount={photos.length} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Henüz fotoğraf yok</Text>
            <Text style={styles.emptyText}>
              Her gün bir fotoğraf ekle; sonra hepsini ilk günden bugüne bir videoda izle.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DayRow group={item} onPhotoPress={setSelected} onAdd={() => setAdding({ day: item.day })} />
        )}
      />
      <View style={styles.fab}>
        <Button title="+  Fotoğraf ekle" onPress={() => setAdding({})} />
      </View>

      {adding && <AddPhotoModal initialDay={adding.day} onClose={() => setAdding(null)} />}
      {selected && <PhotoModal key={selected.id} photo={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

function Summary({ groups, photoCount }: { groups: DayGroup[]; photoCount: number }) {
  if (groups.length === 0) return null;
  const first = groups[groups.length - 1];
  const last = groups[0];
  return (
    <View style={styles.summary}>
      <Stat value={String(groups.length)} label="fotoğraflı gün" />
      <Stat value={String(photoCount)} label="fotoğraf" />
      <Stat value={String(last.dayNumber)} label="gündür devam" />
      <Text style={styles.range}>
        {formatDayShort(first.day)} → {formatDayShort(last.day)}
      </Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DayRow({
  group,
  onPhotoPress,
  onAdd,
}: {
  group: DayGroup;
  onPhotoPress: (photo: Photo) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.day}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayTitle}>{formatDay(group.day)}</Text>
          <Text style={styles.daySubtitle}>{formatWeekday(group.day)}</Text>
        </View>
        <Text style={styles.dayBadge}>Gün {group.dayNumber}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
        {group.photos.map((photo) => (
          <Pressable key={photo.id} onPress={() => onPhotoPress(photo)}>
            <Image
              source={{ uri: photoFile(photo.fileName).uri }}
              style={styles.thumb}
              contentFit="cover"
              recyclingKey={String(photo.id)}
            />
          </Pressable>
        ))}
        <Pressable accessibilityLabel="Bu güne fotoğraf ekle" onPress={onAdd} style={[styles.thumb, styles.addThumb]}>
          <Text style={styles.addThumbText}>+</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const THUMB_WIDTH = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.accent, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  range: { width: '100%', textAlign: 'center', color: colors.textMuted, marginTop: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  day: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  daySubtitle: { color: colors.textMuted, fontSize: 12 },
  dayBadge: {
    color: colors.accent,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  thumbs: { gap: spacing.sm },
  thumb: { width: THUMB_WIDTH, height: THUMB_WIDTH * 1.33, borderRadius: radius.sm, backgroundColor: '#000' },
  addThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addThumbText: { color: colors.textMuted, fontSize: 28 },
  fab: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
});
