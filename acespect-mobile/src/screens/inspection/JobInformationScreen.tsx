import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { AppTextInput, Button, ProgressBar, SegmentedToggle } from '../../components/ui';
import { InspectionHeader } from '../../components/inspection/InspectionHeader';
import { SectionCard } from '../../components/inspection/SectionCard';
import { ChoiceTileGrid } from '../../components/inspection/ChoiceTile';
import { StatusRow } from '../../components/inspection/StatusRow';
import { MOCK_JOB_DETAILS, WEATHER_OPTIONS } from '../../constants/jobSetupData';
import { PropertyUse, WeatherId } from '../../types/jobSetup';
import { AppScreenProps } from '../../navigation/types';
import { useSystemStatus } from '../../hooks/useSystemStatus';

export function JobInformationScreen({
  route,
  navigation,
}: AppScreenProps<'JobInformation'>) {
  const { selection } = route.params;

  // Pre-loaded job details (mock admin-platform fetch) — editable on-site.
  const [details, setDetails] = useState(MOCK_JOB_DETAILS);
  const [weather, setWeather] = useState<WeatherId | null>(null);
  const [usedAsBusiness, setUsedAsBusiness] = useState<PropertyUse | null>(null);
  const systemStatus = useSystemStatus();

  const setField = (key: keyof typeof details) => (text: string) =>
    setDetails((d) => ({ ...d, [key]: text }));

  const canContinue = !!weather && !!usedAsBusiness;

  const onNext = () => {
    if (!canContinue) return;
    navigation.navigate('InspectionSetupStep2', {
      data: {
        selection,
        details,
        weather: weather!,
        usedAsBusiness: usedAsBusiness!,
        systemStatus: systemStatus.snapshot,
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <InspectionHeader
        title="Job Information"
        subtitle="Inspection Setup · Step 1 of 2"
        onBack={() => navigation.goBack()}
        actions={[
          {
            icon: 'save-outline',
            accessibilityLabel: 'Save draft',
            onPress: () => Alert.alert('Draft saved', 'Job setup saved locally.'),
          },
          {
            icon: 'home-outline',
            accessibilityLabel: 'Home',
            onPress: () => navigation.popToTop(),
          },
        ]}
      />

      <View style={styles.progressWrap}>
        <ProgressBar progress={0.5} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={18} color={colors.infoFg} />
          <Text style={styles.bannerText}>
            Verify and confirm all job details before beginning the inspection.
            Pre-loaded information comes from the admin platform.
          </Text>
        </View>

        {/* JOB DETAILS */}
        <SectionCard title="JOB DETAILS" accent="blue">
          <AppTextInput
            label="Job Number"
            required
            value={details.jobNumber}
            onChangeText={setField('jobNumber')}
          />
          <Spacer />
          <AppTextInput
            label="Inspection Date"
            required
            rightIcon="calendar-outline"
            value={details.inspectionDate}
            onChangeText={setField('inspectionDate')}
          />
          <Spacer />
          <AppTextInput
            label="Client Name"
            required
            value={details.clientName}
            onChangeText={setField('clientName')}
          />
          <Spacer />
          <AppTextInput
            label="Inspection Address"
            required
            value={details.inspectionAddress}
            onChangeText={setField('inspectionAddress')}
          />
          <Spacer />
          <AppTextInput
            label="Assigned Inspector"
            required
            readOnly
            value={details.assignedInspector}
          />
          {details.gpsConfirmed && (
            <View style={styles.gpsNote}>
              <Ionicons name="location" size={14} color={colors.barGreen} />
              <Text style={styles.gpsText}>
                <Text style={styles.gpsBold}>Confirmed: </Text>
                {details.inspectionAddress} · GPS locked
              </Text>
            </View>
          )}
        </SectionCard>

        {/* WEATHER CONDITIONS */}
        <SectionCard title="WEATHER CONDITIONS" accent="orange">
          <Text style={styles.fieldLabel}>
            Current Onsite Weather<Text style={styles.req}> *</Text>
          </Text>
          <Text style={styles.helper}>
            Weather conditions affect visibility, moisture, and inspection limitations.
          </Text>
          <ChoiceTileGrid
            options={WEATHER_OPTIONS}
            value={weather}
            onChange={(v) => setWeather(v as WeatherId)}
            columns={3}
          />
        </SectionCard>

        {/* PROPERTY USE */}
        <SectionCard title="PROPERTY USE" accent="purple">
          <Text style={styles.fieldLabel}>
            Is this property currently being used as a business?
            <Text style={styles.req}> *</Text>
          </Text>
          <View style={{ height: spacing.md }} />
          <SegmentedToggle
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={usedAsBusiness}
            onChange={(v) => setUsedAsBusiness(v)}
          />
        </SectionCard>

        {/* SYSTEM STATUS */}
        <SectionCard title="SYSTEM STATUS" accent="green">
          <Text style={[styles.helper, styles.statusHelper]}>
            The following are automatically initialised when the inspection begins.
          </Text>
          <StatusRow
            icon="time-outline"
            label="Inspection Started"
            value={systemStatus.startedAt.value}
            done={systemStatus.startedAt.ready}
          />
          <StatusRow
            icon="location-outline"
            label="GPS Location"
            value={systemStatus.gpsLocation.value}
            done={systemStatus.gpsLocation.ready}
          />
          <StatusRow
            icon="camera-outline"
            label="Photo Sequence"
            value={systemStatus.photoSequence.value}
            done={systemStatus.photoSequence.ready}
          />
          <StatusRow
            icon="wifi-outline"
            label="Cloud Sync"
            value={systemStatus.cloudSync.value}
            done={systemStatus.cloudSync.ready}
          />
          <StatusRow
            icon="save-outline"
            label="Offline Save"
            value={systemStatus.offlineSave.value}
            done={systemStatus.offlineSave.ready}
          />
        </SectionCard>
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
            label="Next"
            variant="primaryGradient"
            rightIcon="chevron-forward"
            disabled={!canContinue}
            onPress={onNext}
            style={styles.nextBtn}
          />
        </View>
        {!canContinue && (
          <Text style={styles.footerHint}>
            {!weather
              ? 'Select the onsite weather to continue'
              : 'Confirm property use to continue'}
          </Text>
        )}
      </SafeAreaView>
    </View>
  );
}

function Spacer() {
  return <View style={{ height: spacing.lg }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
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
  fieldLabel: { ...typography.label, color: colors.textSecondary },
  req: { color: colors.danger, fontWeight: '700' },
  helper: {
    ...typography.caption,
    color: colors.accentBlueFg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  statusHelper: { color: colors.accentOrangeFg },
  gpsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  gpsText: { ...typography.caption, color: colors.textSecondary, flex: 1, marginLeft: spacing.sm },
  gpsBold: { fontWeight: '700', color: colors.textPrimary },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextBtn: { flex: 1 },
  footerHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
