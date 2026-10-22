import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DayKey, formatDay, formatWeekday, fromDayKey, toDayKey } from '../lib/dates';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  value: DayKey;
  onChange: (day: DayKey) => void;
};

/** Lets the user pick any day up to today, so past photos can be added too. */
export function DateField({ label, value, onChange }: Props) {
  const [iosOpen, setIosOpen] = useState(false);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromDayKey(value),
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_event, date) => onChange(toDayKey(date)),
      });
    } else {
      setIosOpen((v) => !v);
    }
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={open} style={styles.field}>
        <Text style={styles.value}>{formatDay(value)}</Text>
        <Text style={styles.weekday}>{formatWeekday(value)}</Text>
      </Pressable>
      {iosOpen && (
        <DateTimePicker
          value={fromDayKey(value)}
          mode="date"
          display="inline"
          maximumDate={new Date()}
          onValueChange={(_event, date) => onChange(toDayKey(date))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: { color: colors.text, fontSize: 17, fontWeight: '700' },
  weekday: { color: colors.textMuted },
});
