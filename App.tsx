import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrate } from './src/db/photos';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { VideoScreen } from './src/screens/VideoScreen';
import { PhotosProvider } from './src/state/PhotosContext';
import { colors, spacing } from './src/theme';

type Tab = 'timeline' | 'video';

const TABS: { key: Tab; title: string }[] = [
  { key: 'timeline', title: 'Günlük' },
  { key: 'video', title: 'Video' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('timeline');

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
        <PhotosProvider>
          <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <StatusBar style="light" />
            <Text style={styles.appTitle}>Gelişim Günlüğü</Text>
            {/* Both screens stay mounted so a running video export survives switching tabs. */}
            <View style={[styles.screen, tab !== 'timeline' && styles.hidden]}>
              <TimelineScreen />
            </View>
            <View style={[styles.screen, tab !== 'video' && styles.hidden]}>
              <VideoScreen />
            </View>
            <View style={styles.tabBar}>
              {TABS.map(({ key, title }) => (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === key }}
                  onPress={() => setTab(key)}
                  style={styles.tab}>
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{title}</Text>
                  <View style={[styles.tabIndicator, tab === key && styles.tabIndicatorActive]} />
                </Pressable>
              ))}
            </View>
          </SafeAreaView>
        </PhotosProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  appTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  screen: { flex: 1 },
  hidden: { display: 'none' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.md, gap: spacing.sm },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  tabTextActive: { color: colors.text },
  tabIndicator: { height: 3, width: 32, borderRadius: 2, backgroundColor: 'transparent' },
  tabIndicatorActive: { backgroundColor: colors.accent },
});
