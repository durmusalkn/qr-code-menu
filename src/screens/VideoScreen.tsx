import { File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import TimelapseEncoder, { EncodeProgress } from '../../modules/timelapse-encoder';
import { Button } from '../components/Button';
import { Chips } from '../components/Chips';
import { formatDayShort } from '../lib/dates';
import { deleteVideosExcept, latestVideo, newVideoFile, photoFile } from '../lib/storage';
import {
  buildFrames,
  DEFAULT_VIDEO_SETTINGS,
  estimateDuration,
  formatDuration,
  resolutionSize,
  sortChronologically,
  SPEED_OPTIONS,
  VIDEO_FPS,
  VideoSettings,
} from '../lib/video';
import { usePhotos } from '../state/PhotosContext';
import { colors, radius, spacing } from '../theme';

export function VideoScreen() {
  const { photos } = usePhotos();
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [progress, setProgress] = useState<EncodeProgress | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(() => latestVideo()?.uri ?? null);
  const [busyAction, setBusyAction] = useState<'save' | 'share' | null>(null);
  // Progress events are delivered asynchronously and may arrive after encodeAsync settles.
  const runningRef = useRef(false);

  const ordered = useMemo(() => sortChronologically(photos), [photos]);
  const encoding = progress !== null;
  const duration = estimateDuration(ordered.length, settings.secondsPerPhoto);

  useEffect(() => {
    const subscription = TimelapseEncoder.addListener('onProgress', (p) => {
      if (runningRef.current) setProgress(p);
    });
    return () => subscription.remove();
  }, []);

  const update = (patch: Partial<VideoSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const generate = async () => {
    const output = newVideoFile();
    const { width, height, bitRate } = resolutionSize(settings.resolution);
    runningRef.current = true;
    setProgress({ current: 0, total: ordered.length });
    try {
      const uri = await TimelapseEncoder.encodeAsync({
        frames: buildFrames(ordered, settings.showDateLabel, (photo) => photoFile(photo.fileName).uri),
        outputUri: output.uri,
        width,
        height,
        fps: VIDEO_FPS,
        secondsPerPhoto: settings.secondsPerPhoto,
        bitRate,
      });
      deleteVideosExcept(output);
      setVideoUri(uri);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'ERR_CANCELLED') {
        Alert.alert('Video oluşturulamadı', e instanceof Error ? e.message : String(e));
      }
    } finally {
      runningRef.current = false;
      setProgress(null);
    }
  };

  const saveToGallery = async () => {
    if (!videoUri) return;
    setBusyAction('save');
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['video']);
      if (!permission.granted) {
        Alert.alert('İzin gerekli', 'Videoyu galeriye kaydetmek için izin vermelisin.');
        return;
      }
      await MediaLibrary.Asset.create(videoUri);
      Alert.alert('Kaydedildi', 'Video galeriye kaydedildi.');
    } catch (e) {
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setBusyAction(null);
    }
  };

  const share = async () => {
    if (!videoUri) return;
    setBusyAction('share');
    try {
      await Sharing.shareAsync(videoUri, { mimeType: 'video/mp4', dialogTitle: 'Gelişim videosunu paylaş' });
    } finally {
      setBusyAction(null);
    }
  };

  if (ordered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Video için fotoğraf yok</Text>
        <Text style={styles.emptyText}>Önce Günlük sekmesinden fotoğraf ekle.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {videoUri && !encoding && <Preview uri={videoUri} />}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gelişim videosu</Text>
        <Text style={styles.muted}>
          {ordered.length} fotoğraf · {formatDayShort(ordered[0].day)} → {formatDayShort(ordered[ordered.length - 1].day)}
        </Text>
        <Text style={styles.muted}>Tahmini süre: {formatDuration(duration)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Fotoğraf başına süre</Text>
        <Chips
          options={SPEED_OPTIONS}
          value={settings.secondsPerPhoto as (typeof SPEED_OPTIONS)[number]}
          onChange={(secondsPerPhoto) => update({ secondsPerPhoto })}
          format={(s) => `${s} sn`}
          disabled={encoding}
        />

        <Text style={styles.label}>Çözünürlük</Text>
        <Chips
          options={['720p', '1080p'] as const}
          value={settings.resolution}
          onChange={(resolution) => update({ resolution })}
          disabled={encoding}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Gün ve tarihi videoya yaz</Text>
          <Switch
            value={settings.showDateLabel}
            onValueChange={(showDateLabel) => update({ showDateLabel })}
            disabled={encoding}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {encoding ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video oluşturuluyor…</Text>
          <ProgressBar value={progress.total ? progress.current / progress.total : 0} />
          <Text style={styles.muted}>
            {progress.current} / {progress.total} fotoğraf
          </Text>
          <Button title="İptal" variant="secondary" onPress={() => TimelapseEncoder.cancel()} />
        </View>
      ) : (
        <Button title={videoUri ? 'Videoyu yeniden oluştur' : 'Videoyu oluştur'} onPress={generate} />
      )}

      {videoUri && !encoding && (
        <View style={styles.row}>
          <Button
            title="Galeriye kaydet"
            variant="secondary"
            onPress={saveToGallery}
            loading={busyAction === 'save'}
            disabled={busyAction !== null}
            style={styles.flex}
          />
          <Button
            title="Paylaş"
            variant="secondary"
            onPress={share}
            loading={busyAction === 'share'}
            disabled={busyAction !== null}
            style={styles.flex}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Preview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });
  // Guards against a stale URI if the file was removed outside the app.
  if (!new File(uri).exists) return null;
  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  video: { width: '100%', aspectRatio: 9 / 16, maxHeight: 520, backgroundColor: '#000', borderRadius: radius.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, fontWeight: '600' },
  progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
