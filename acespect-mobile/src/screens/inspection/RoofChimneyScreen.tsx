import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from '../../components/ui';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';
import { CapturedPhoto } from '../../types/photo';
import { useInspectionDraft } from '../../context/InspectionDraftContext';
import {
  Card,
  ChipMultiSelect,
  ColorOption,
  ColorOptionList,
  ItemStatus,
  PhotoStrip,
  SectionGradientHeader,
  SectionLabel,
  Toast,
  YesNoToggle,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
interface RoofItem {
  status: ItemStatus;
  available: 'yes' | 'no' | null;
  accessibility: string[];
  inspectedFrom: string[];
  coveringType: string[];
  generalCondition: string;
  generalObservations: string[];
  chimneyObservations: string[];
  moistureObservations: string[];
  notes: string;
  photos: CapturedPhoto[];
}

/* ─── Option data ──────────────────────────────────────────────────── */
const ROOF_TABS = ['Upper Roof & Chimneys', 'Lower Roof & Chimneys'];

const ACCESSIBILITY_OPTIONS = [
  'Not Applicable (Single Storey)', 'Apartment', 'No Chimneys',
  'Could Not Observe (Flat Roof)', 'Inspected Partly From',
];
const INSPECTED_FROM_OPTIONS = ['Upstairs Windows', 'Balcony', 'Ground Level', 'Drone', 'Other'];
const COVERING_TYPE_OPTIONS = ['Metal Roof', 'Colorbond', 'Roof Tiles', 'Concrete Tiles', 'Terracotta Tiles', 'Fibre Cement', 'Flat Roof Membrane', 'Other'];
const CONDITIONS: ColorOption[] = [
  { value: 'satisfactory', label: 'Satisfactory — Typical Weathering', color: '#16A34A' },
  { value: 'fair', label: 'Fair', color: '#CA8A04' },
  { value: 'average', label: 'Average', color: '#EA580C' },
  { value: 'poor', label: 'Poor', color: '#DC2626' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));
const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]));
const GENERAL_OBS = ['Limited from Ground Level', 'Surface Rust Observed', 'Cracked Tiles', 'Loose Tiles', 'Gaps at Flashings', 'Roof Sagging', 'Ponding Observed', 'Other'];
const CHIMNEY_OBS = ['No Chimney Present', 'Gaps / Cracking to Brickwork', 'Chimney Appears Unstable', 'Leaning Chimney', 'Deteriorated Mortar', 'Flashing Damage', 'Other'];
const MOISTURE_OBS = ['Water Staining', 'Moisture Signs', 'Overflow Signs', 'Leaking Observed', 'No Issues Observed'];

function makeRoof(): RoofItem {
  return {
    status: 'pending',
    available: null,
    accessibility: [],
    inspectedFrom: [],
    coveringType: [],
    generalCondition: '',
    generalObservations: [],
    chimneyObservations: [],
    moistureObservations: [],
    notes: '',
    photos: [],
  };
}

/* ─── Screen ───────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

export function RoofChimneyScreen({ onBack, onComplete, onGoHome }: Props) {
  const [roofs, setRoofs] = useState<RoofItem[]>([makeRoof(), makeRoof()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const item = roofs[activeIdx];
  const label = ROOF_TABS[activeIdx];

  const saveToDraft = () => {
    const reportText =
      roofs
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.available === 'yes')
        .map(({ r, i }) => {
          const lbl = ROOF_TABS[i].replace(' & Chimneys', '');
          let s = `${lbl} roof`;
          if (r.coveringType.length) s += `: ${r.coveringType.join('/').toLowerCase()}`;
          if (r.generalCondition) s += `, in ${(CONDITION_LABEL[r.generalCondition] || r.generalCondition).toLowerCase()} condition`;
          s += '.';
          if (r.generalObservations.length) s += ` Observations: ${r.generalObservations.join(', ').toLowerCase()}.`;
          if (r.chimneyObservations.length) s += ` Chimney: ${r.chimneyObservations.join(', ').toLowerCase()}.`;
          if (r.notes) s += ` ${r.notes}`;
          return s;
        })
        .join(' ') ||
      (roofs.some((r) => r.available === 'no') ? 'Roof not accessible / not present.' : 'Roof & chimneys not recorded.');
    const photos = roofs.flatMap((r) => r.photos.map((p) => p.uri));
    draft.setSection({
      key: 'roof_chimneys',
      name: 'Roof Covering & Chimneys',
      icon: '🏘️',
      order: 10,
      status: 'complete',
      reportText,
      fields: { sections: String(roofs.length) },
      photos,
    });
  };

  const upd = (updates: Partial<RoofItem>) =>
    setRoofs((prev) =>
      prev.map((r, i) => (i === activeIdx ? { ...r, ...updates, status: r.status === 'pending' ? 'in-progress' : r.status } : r)),
    );

  const toggleArr = (
    field: 'accessibility' | 'inspectedFrom' | 'coveringType' | 'generalObservations' | 'chimneyObservations' | 'moistureObservations',
    val: string,
  ) => {
    const cur = item[field];
    upd({ [field]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  async function capturePhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: 'roof_chimneys', sortOrder: item.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...item.photos, photo] });
  }

  function completeRoof() {
    setRoofs((prev) => prev.map((r, i) => (i === activeIdx ? { ...r, status: 'complete' } : r)));
    const next = roofs.findIndex((r, i) => i !== activeIdx && r.status !== 'complete');
    if (next >= 0) {
      setActiveIdx(next);
      show(`${label.replace(' & Chimneys', '')} roof complete`);
    } else {
      show('Roof & chimneys complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = roofs.filter((r) => r.status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow="ROOF COVERING & CHIMNEYS"
        title={label}
        status={item.status}
        conditionLabel={item.generalCondition ? CONDITION_LABEL[item.generalCondition] : undefined}
        conditionColor={item.generalCondition ? CONDITION_COLOR[item.generalCondition] : undefined}
        onBack={onBack}
        onSave={() => show('Draft saved')}
        onHome={onGoHome}
      />

      {/* Fixed 2-tab strip */}
      <View style={styles.tabStrip}>
        {ROOF_TABS.map((rt, i) => {
          const active = i === activeIdx;
          const st = roofs[i].status;
          const dot = st === 'complete' ? colors.success : st === 'in-progress' ? colors.warning : colors.stepInactive;
          return (
            <Pressable key={rt} onPress={() => setActiveIdx(i)} style={[styles.tab, active && styles.tabActive]}>
              <View style={styles.tabInner}>
                <View style={[styles.tabDot, { backgroundColor: dot }]} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{rt.replace(' & Chimneys', '')}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available */}
        <Card>
          <SectionLabel>Roof Section Available</SectionLabel>
          <YesNoToggle value={item.available} onChange={(v) => upd({ available: v })} />
        </Card>

        {item.available === 'no' && (
          <View style={styles.notPresent}>
            <Ionicons name="home-outline" size={22} color={colors.textMuted} />
            <View style={styles.flex1}>
              <Text style={styles.notPresentTitle}>Not Present</Text>
              <Text style={styles.notPresentText}>No inspection required for this roof section.</Text>
            </View>
          </View>
        )}

        {item.available === 'yes' && (
          <>
            {/* A. Accessibility / Visibility */}
            <Card>
              <SectionLabel>A. Roof Accessibility / Visibility</SectionLabel>
              <ChipMultiSelect options={ACCESSIBILITY_OPTIONS} selected={item.accessibility} onToggle={(v) => toggleArr('accessibility', v)} />
              {item.accessibility.includes('Inspected Partly From') && (
                <View style={styles.subGroup}>
                  <Text style={styles.subLabel}>Inspected From</Text>
                  <ChipMultiSelect options={INSPECTED_FROM_OPTIONS} selected={item.inspectedFrom} onToggle={(v) => toggleArr('inspectedFrom', v)} />
                </View>
              )}
            </Card>

            {/* B. Covering Type */}
            <Card>
              <SectionLabel>B. Roof Covering Type</SectionLabel>
              <ChipMultiSelect options={COVERING_TYPE_OPTIONS} selected={item.coveringType} onToggle={(v) => toggleArr('coveringType', v)} />
            </Card>

            {/* C. General Condition */}
            <Card>
              <SectionLabel>C. General Roof Condition</SectionLabel>
              <ColorOptionList options={CONDITIONS} value={item.generalCondition} onChange={(v) => upd({ generalCondition: v })} />
            </Card>

            {/* D. General Observations */}
            <Card>
              <SectionLabel>D. General Roof Observations</SectionLabel>
              <ChipMultiSelect options={GENERAL_OBS} selected={item.generalObservations} onToggle={(v) => toggleArr('generalObservations', v)} />
            </Card>

            {/* E. Chimney Observations */}
            <Card>
              <SectionLabel>E. Chimney Observations</SectionLabel>
              <ChipMultiSelect options={CHIMNEY_OBS} selected={item.chimneyObservations} onToggle={(v) => toggleArr('chimneyObservations', v)} />
            </Card>

            {/* F. Moisture / Water */}
            <Card>
              <SectionLabel>F. Moisture / Water Observations</SectionLabel>
              <ChipMultiSelect options={MOISTURE_OBS} selected={item.moistureObservations} onToggle={(v) => toggleArr('moistureObservations', v)} />
            </Card>

            {/* G. Inspector Notes */}
            <Card>
              <SectionLabel>G. Inspector Notes</SectionLabel>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Enter your observations and notes here..."
                placeholderTextColor={colors.textMuted}
                value={item.notes}
                onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{item.notes.length}/500</Text>
            </Card>

            {/* H. Additional Photographs */}
            <Card>
              <SectionLabel>H. Additional Photographs</SectionLabel>
              <Text style={styles.helper}>{item.photos.length} linked to {label.replace(' & Chimneys', '')} roof</Text>
              <PhotoStrip photos={item.photos} onCapture={capturePhoto} />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / roofs.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/{roofs.length} sections</Text>
        </View>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={() => show('Draft saved')} />
          <Button label="Back" variant="outline" leftIcon="chevron-back" fitContent onPress={onBack} />
        </View>
        <Button
          label={item.status === 'complete' ? `${label.replace(' & Chimneys', '')} Roof Complete` : `Complete ${label.replace(' & Chimneys', '')} Roof`}
          variant={item.status === 'complete' ? 'successGradient' : 'primaryGradient'}
          leftIcon="checkmark"
          onPress={completeRoof}
        />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  tabStrip: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.headerGradientFrom },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tabDot: { width: 7, height: 7, borderRadius: 4 },
  tabText: { ...typography.caption, color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },

  subGroup: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  subLabel: { ...typography.caption, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },

  input: {
    ...typography.bodySm,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: { minHeight: 88 },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },

  notPresent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notPresentTitle: { ...typography.bodySm, fontWeight: '700', color: colors.textSecondary },
  notPresentText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.success },
  progressText: { ...typography.caption, color: colors.textMuted },
});
