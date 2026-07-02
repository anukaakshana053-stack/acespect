import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../../components/ui';
import { InspectionHeader } from '../../components/inspection/InspectionHeader';
import {
  OVERVIEW_PHOTO_CATEGORIES,
  PHOTO_GUIDELINES,
  RECOMMENDED_PHOTO_RANGE,
  REQUIRED_PHOTO_COUNT,
} from '../../constants/overviewPhotos';
import { AppScreenProps } from '../../navigation/types';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';
import { CapturedPhoto } from '../../types/photo';
import { useInspectionDraft } from '../../context/InspectionDraftContext';

/**
 * Inspection Setup · Step 2 of 2 — "Description & Overview".
 * The inspector captures overview/context photos (front elevation, street
 * number, surroundings, …) before the detailed inspection begins.
 *
 * Capture is a local placeholder for now (marks a category as captured and
 * updates the required-count); wiring the real camera is a follow-up.
 */
export function InspectionSetupStep2Screen({
  navigation,
  route,
}: AppScreenProps<'InspectionSetupStep2'>) {
  const [captured, setCaptured] = useState<Record<string, CapturedPhoto>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const { takePhoto } = usePhotoCapture();
  const draft = useInspectionDraft();

  const requiredCaptured = OVERVIEW_PHOTO_CATEGORIES.filter(
    (c) => c.required && captured[c.id],
  ).length;

  const captureCategory = async (id: string, label: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const shot = await takePhoto({
        caption: label,
        category: id,
        sectionKey: 'description',
      });
      if (shot) setCaptured((prev) => ({ ...prev, [id]: shot }));
    } finally {
      setBusyId(null);
    }
  };

  const onBegin = () => {
    draft.setSection({
      key: 'description',
      name: 'Description & Overview',
      icon: '🏠',
      order: 1,
      status: 'complete',
      reportText:
        'The subject property was inspected. Overview and context photographs (front elevation, ' +
        'street number, and surrounding areas) were captured prior to the detailed inspection.',
      fields: { overviewPhotos: String(Object.keys(captured).length) },
      photos: Object.values(captured).map((p) => p.uri),
    });
    navigation.navigate('InspectionSections', { data: route.params.data });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <InspectionHeader
        title="Description & Overview"
        subtitle="Inspection Setup · Step 2 of 2"
        onBack={() => navigation.goBack()}
        actions={[
          {
            icon: 'save-outline',
            accessibilityLabel: 'Save draft',
            onPress: () => Alert.alert('Draft saved', 'Overview progress saved locally.'),
          },
          {
            icon: 'home-outline',
            accessibilityLabel: 'Home',
            onPress: () => navigation.popToTop(),
          },
        ]}
      />

      {/* Two-step progress: step 1 complete (green) · step 2 active (blue) */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressSeg, styles.progressDone]} />
        <View style={[styles.progressSeg, styles.progressActive]} />
      </View>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={18} color={colors.infoFg} />
          <Text style={styles.bannerText}>
            Capture overview and context photos from public access areas and
            surrounding locations before detailed inspection begins.
          </Text>
        </View>

        {/* Overview photos summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>Overview Photos</Text>
            <Text style={styles.summaryMeta}>
              {requiredCaptured} of {REQUIRED_PHOTO_COUNT} required captured ·{' '}
              {RECOMMENDED_PHOTO_RANGE}
            </Text>
          </View>
          <Pressable
            style={styles.summaryFab}
            accessibilityRole="button"
            accessibilityLabel="Capture overview photo"
          >
            <Ionicons name="camera" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Photo guidelines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PHOTO GUIDELINES</Text>
          {PHOTO_GUIDELINES.map((g, i) => (
            <View key={g.title} style={styles.guideRow}>
              <View style={styles.guideBadge}>
                <Text style={styles.guideBadgeText}>{i + 1}</Text>
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideTitle}>{g.title}</Text>
                <Text style={styles.guideDetail}>{g.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Overview photo categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OVERVIEW PHOTO CATEGORIES</Text>
          {OVERVIEW_PHOTO_CATEGORIES.map((cat) => {
            const photo = captured[cat.id];
            const isCaptured = !!photo;
            const isBusy = busyId === cat.id;
            return (
              <View key={cat.id} style={styles.catRow}>
                <View style={[styles.thumb, isCaptured && styles.thumbCaptured]}>
                  {photo ? (
                    <Image source={{ uri: photo.uri }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="camera-outline" size={18} color={colors.textMuted} />
                  )}
                </View>

                <View style={styles.catLabelWrap}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  {cat.required && (
                    <View style={styles.reqBadge}>
                      <Text style={styles.reqBadgeText}>REQUIRED</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={() => captureCategory(cat.id, cat.label)}
                  disabled={isBusy}
                  style={[styles.captureBtn, isCaptured && styles.captureBtnDone]}
                  accessibilityRole="button"
                  accessibilityLabel={`${isCaptured ? 'Retake' : 'Capture'} ${cat.label}`}
                >
                  <Ionicons
                    name={isCaptured ? 'refresh' : 'camera'}
                    size={15}
                    color={isCaptured ? colors.textPrimary : colors.white}
                  />
                  <Text style={[styles.captureBtnText, isCaptured && styles.captureBtnTextDone]}>
                    {isBusy ? 'Opening…' : isCaptured ? 'Retake' : 'Capture'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Cloud sync banner */}
        <View style={styles.syncBanner}>
          <Ionicons name="wifi" size={18} color={colors.infoFg} />
          <View style={styles.syncTextWrap}>
            <Text style={styles.syncTitle}>Cloud Sync Active</Text>
            <Text style={styles.syncText}>
              Photos are stored in original quality and synced when internet is
              available. Overview photos are permanently linked to this job and
              included in the final report.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerRow}>
          <Button
            label="Back"
            variant="outline"
            leftIcon="chevron-back"
            fitContent
            onPress={() => navigation.goBack()}
          />
          <Button
            label="Begin Inspection"
            variant="successGradient"
            rightIcon="checkmark"
            onPress={onBegin}
            style={styles.beginBtn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  progressWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  progressSeg: { flex: 1, height: 6, borderRadius: radius.pill },
  progressDone: { backgroundColor: colors.barGreen },
  progressActive: { backgroundColor: colors.progressFill },

  bodyScroll: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  banner: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.infoFg,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTextWrap: { flex: 1 },
  summaryTitle: { ...typography.h3, color: colors.accentBlueFg },
  summaryMeta: { ...typography.bodySm, color: colors.infoFg, marginTop: spacing.xs },
  summaryFab: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.progressFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    ...shadows.card,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  guideBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.stepActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  guideBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  guideTextWrap: { flex: 1 },
  guideTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  guideDetail: { ...typography.bodySm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  thumbCaptured: { backgroundColor: colors.accentGreen },
  thumbImg: { width: '100%', height: '100%', borderRadius: radius.sm },
  catLabelWrap: { flex: 1, marginRight: spacing.md },
  catLabel: { ...typography.bodySm, fontWeight: '600', color: colors.textPrimary },
  reqBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  reqBadgeText: { fontSize: 10, fontWeight: '700', color: colors.danger, letterSpacing: 0.4 },

  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.headerGradientFrom,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  captureBtnDone: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  captureBtnText: { ...typography.label, color: colors.white, marginLeft: spacing.xs },
  captureBtnTextDone: { color: colors.textPrimary },

  syncBanner: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  syncTextWrap: { flex: 1, marginLeft: spacing.sm },
  syncTitle: { ...typography.label, color: colors.infoFg, fontWeight: '700' },
  syncText: { ...typography.bodySm, color: colors.infoFg, marginTop: 2, lineHeight: 18 },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  beginBtn: { flex: 1 },
});
