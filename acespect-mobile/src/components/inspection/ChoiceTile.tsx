import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

export interface TileOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ChoiceTileGridProps {
  options: TileOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Tiles per row. */
  columns?: number;
}

/** Responsive grid of icon+label tiles with single selection (e.g. weather). */
export function ChoiceTileGrid({ options, value, onChange, columns = 3 }: ChoiceTileGridProps) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tile,
              { width: `${100 / columns}%` },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.inner, selected && styles.innerSelected]}>
              <Ionicons
                name={opt.icon}
                size={22}
                color={selected ? colors.tileSelectedBorder : colors.textSecondary}
              />
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.xs },
  tile: { padding: spacing.xs },
  pressed: { opacity: 0.85 },
  inner: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
  },
  innerSelected: {
    borderColor: colors.tileSelectedBorder,
    borderWidth: 1.5,
    backgroundColor: colors.tileSelectedBg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  labelSelected: { color: colors.tileSelectedBorder, fontWeight: '600' },
});
