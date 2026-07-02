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
  DamageRecord,
  DamageRecordCard,
  ItemStatus,
  PhotoStrip,
  PillSelect,
  SectionGradientHeader,
  SectionLabel,
  Toast,
  YesNoToggle,
  makeDamageRecord,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
type ElevationKey = 'front' | 'left' | 'rear' | 'right';

interface ElevationData {
  status: ItemStatus;
  available: 'yes' | 'no' | '';
  orientation: string;
  condition: string;
  obstructions: string[];
  generalDamage: string;
  hasDamage: 'yes' | 'no' | null;
  damages: DamageRecord[];
  claddingObs: string[];
  windowDoorObs: string[];
  eavesObs: string[];
  downpipeGutterObs: string[];
  notes: string;
  photos: CapturedPhoto[];
}

type ElevationsState = Record<ElevationKey, ElevationData>;

/* ─── Option data ──────────────────────────────────────────────────── */
const ELEVATIONS: ElevationKey[] = ['front', 'left', 'rear', 'right'];
const ELEVATION_LABELS: Record<ElevationKey, string> = { front: 'Front', left: 'Left', rear: 'Rear', right: 'Right' };

const ORIENTATIONS = ['North', 'South', 'East', 'West', 'Other'];

const CONDITIONS: ColorOption[] = [
  { value: 'satisfactory', label: 'Satisfactory — Typical Wear', color: '#16A34A' },
  { value: 'fair', label: 'Fair', color: '#3B82F6' },
  { value: 'average', label: 'Average', color: '#D97706' },
  { value: 'poor', label: 'Poor', color: '#DC2626' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));
const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]));

const GENERAL_DAMAGE: ColorOption[] = [
  { value: 'none', label: 'No Visible Significant Damage', color: '#16A34A' },
  { value: 'minor', label: 'Several Minor Gaps and Cracks', color: '#D97706' },
  { value: 'multiple', label: 'Multiple Items of Damage Throughout', color: '#EA580C' },
  { value: 'localised', label: 'Localised Damage Observed', color: '#D97706' },
  { value: 'structural', label: 'Structural Movement Observed', color: '#DC2626' },
];

const DAMAGE_TYPES = ['Crack', 'Subsidence', 'Gap', 'Hole', 'Chipping', 'Surface Damage', 'Tile Damage', 'Movement', 'Rust', 'Other'];
const OBSTRUCTIONS = ['Vegetation', 'Appliances', 'Trailer', 'Caravan', 'Sheds', 'Stored Goods', 'Other'];
const CLADDING_OBS = ['Paint Flaking', 'Timber Cracked', 'Decay to Boards', 'Separation at Joints', 'Surface Deterioration', 'Other'];
const WINDOW_DOOR_OBS = ['Paint Flaking', 'Gaps Around Windows', 'Gaps at Cladding', 'Broken Glazing', 'Decay to Frames', 'Decay to Sashes', 'Door Delaminating', 'Other'];
const EAVES_OBS = ['Water Stains', 'Dark Mould', 'Gaps at Sheet Joins', 'Gaps at Quads', 'Cracked Eave Linings', 'Other'];
const DOWNPIPE_GUTTER_OBS = ['Rusted', 'Sagging', 'Loose Connection', 'Not Connected to Stormwater', 'Overflow Signs', 'Other'];

function makeElevation(): ElevationData {
  return {
    status: 'pending',
    available: '',
    orientation: '',
    condition: '',
    obstructions: [],
    generalDamage: '',
    hasDamage: null,
    damages: [],
    claddingObs: [],
    windowDoorObs: [],
    eavesObs: [],
    downpipeGutterObs: [],
    notes: '',
    photos: [],
  };
}

const INITIAL: ElevationsState = {
  front: makeElevation(),
  left: makeElevation(),
  rear: makeElevation(),
  right: makeElevation(),
};

/* ─── Screen ───────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

export function ElevationsScreen({ onBack, onComplete, onGoHome }: Props) {
  const [elevations, setElevations] = useState<ElevationsState>(INITIAL);
  const [activeTab, setActiveTab] = useState<ElevationKey>('front');
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const elev = elevations[activeTab];

  const saveToDraft = () => {
    const filled = ELEVATIONS.filter((e) => elevations[e].available === 'yes');
    const reportText =
      filled
        .map((e) => {
          const d = elevations[e];
          let s = `${ELEVATION_LABELS[e]} elevation`;
          if (d.orientation) s += ` (${d.orientation.toLowerCase()})`;
          if (d.condition) s += ` is in ${(CONDITION_LABEL[d.condition] || d.condition).toLowerCase()} condition`;
          s += '.';
          if (d.claddingObs.length) s += ` Cladding: ${d.claddingObs.join(', ').toLowerCase()}.`;
          if (d.notes) s += ` ${d.notes}`;
          return s;
        })
        .join(' ') || 'No elevations recorded.';
    const damages = ELEVATIONS.flatMap((e) =>
      elevations[e].hasDamage === 'yes'
        ? elevations[e].damages.map((dd) => ({
            type: dd.damageType || 'Damage',
            location: dd.location,
            direction: dd.direction,
            widthMm: parseFloat(dd.widthMm) || 0,
            lengthMm: parseFloat(dd.lengthMm) || 0,
            notes: dd.notes,
            photos: dd.photos.map((p) => p.uri),
          }))
        : [],
    );
    const photos = ELEVATIONS.flatMap((e) => elevations[e].photos.map((p) => p.uri));
    draft.setSection({
      key: 'elevations',
      name: 'Elevations',
      icon: '🏠',
      order: 9,
      status: 'complete',
      reportText,
      fields: { elevations: String(filled.length) },
      photos,
      damages,
    });
  };

  const upd = (updates: Partial<ElevationData>) =>
    setElevations((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...updates,
        status: prev[activeTab].status === 'pending' ? 'in-progress' : prev[activeTab].status,
      },
    }));

  const toggleArr = (
    field: 'obstructions' | 'claddingObs' | 'windowDoorObs' | 'eavesObs' | 'downpipeGutterObs',
    val: string,
  ) => {
    const cur = elev[field];
    upd({ [field]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const addDamage = () => upd({ damages: [...elev.damages, makeDamageRecord(Math.max(0, ...elev.damages.map((d) => d.id)) + 1)] });
  const updateDamage = (id: number, u: Partial<DamageRecord>) => upd({ damages: elev.damages.map((d) => (d.id === id ? { ...d, ...u } : d)) });
  const deleteDamage = (id: number) => upd({ damages: elev.damages.filter((d) => d.id !== id) });

  async function captureDamagePhoto(id: number, kind: 'camera' | 'library') {
    const photo = kind === 'camera'
      ? await takePhoto({ sectionKey: 'elevations', category: 'damage' })
      : await pickFromLibrary({ sectionKey: 'elevations', category: 'damage' });
    if (!photo) return;
    const target = elev.damages.find((d) => d.id === id);
    if (target) updateDamage(id, { photos: [...target.photos, photo] });
  }

  async function captureElevationPhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: 'elevations', sortOrder: elev.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...elev.photos, photo] });
  }

  function completeElevation() {
    setElevations((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], status: 'complete' } }));
    const next = ELEVATIONS.find((e) => e !== activeTab && elevations[e].status !== 'complete');
    if (next) {
      setActiveTab(next);
      show(`${ELEVATION_LABELS[activeTab]} elevation complete`);
    } else {
      show('All elevations complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = ELEVATIONS.filter((e) => elevations[e].status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow="ELEVATIONS"
        title={`${ELEVATION_LABELS[activeTab]} Elevation`}
        status={elev.status}
        conditionLabel={elev.condition ? CONDITION_LABEL[elev.condition] : undefined}
        conditionColor={elev.condition ? CONDITION_COLOR[elev.condition] : undefined}
        onBack={onBack}
        onSave={() => show('Draft saved')}
        onHome={onGoHome}
      />

      {/* Fixed 4-tab strip */}
      <View style={styles.tabStrip}>
        {ELEVATIONS.map((key) => {
          const active = key === activeTab;
          const st = elevations[key].status;
          const dot = st === 'complete' ? colors.success : st === 'in-progress' ? colors.warning : colors.stepInactive;
          return (
            <Pressable key={key} onPress={() => setActiveTab(key)} style={[styles.tab, active && styles.tabActive]}>
              <View style={styles.tabInner}>
                <View style={[styles.tabDot, { backgroundColor: dot }]} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{ELEVATION_LABELS[key]}</Text>
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
          <SectionLabel>Elevation Available</SectionLabel>
          <YesNoToggle value={elev.available || null} onChange={(v) => upd({ available: v })} />
        </Card>

        {elev.available === 'no' && (
          <View style={styles.notPresent}>
            <Ionicons name="business-outline" size={22} color={colors.textMuted} />
            <View style={styles.flex1}>
              <Text style={styles.notPresentTitle}>Not Present</Text>
              <Text style={styles.notPresentText}>{ELEVATION_LABELS[activeTab]} elevation could not be inspected.</Text>
            </View>
          </View>
        )}

        {elev.available === 'yes' && (
          <>
            <Card>
              <SectionLabel>A. Elevation Orientation</SectionLabel>
              <PillSelect options={ORIENTATIONS} value={elev.orientation} onChange={(v) => upd({ orientation: v })} />
            </Card>

            <Card>
              <SectionLabel>B. General Condition</SectionLabel>
              <ColorOptionList options={CONDITIONS} value={elev.condition} onChange={(v) => upd({ condition: v })} />
            </Card>

            <Card>
              <SectionLabel>C. Visibility / Access Obstruction</SectionLabel>
              <ChipMultiSelect options={OBSTRUCTIONS} selected={elev.obstructions} onToggle={(v) => toggleArr('obstructions', v)} />
            </Card>

            <Card>
              <SectionLabel>D. General Damage Condition</SectionLabel>
              <ColorOptionList options={GENERAL_DAMAGE} value={elev.generalDamage} onChange={(v) => upd({ generalDamage: v })} />
            </Card>

            {/* E. Damage / Crack Records — gated behind Yes/No */}
            <Card>
              <SectionLabel>E. Damage / Crack Records</SectionLabel>
              <Text style={styles.helper}>Is there any notable damage or cracking?</Text>
              <YesNoToggle value={elev.hasDamage} onChange={(v) => upd({ hasDamage: v })} />

              {elev.hasDamage === 'yes' && (
                <View style={styles.gateSection}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recordsLabel}>
                      {elev.damages.length} record{elev.damages.length !== 1 ? 's' : ''}
                    </Text>
                    <Pressable onPress={addDamage} style={styles.addDamageBtn}>
                      <Ionicons name="add" size={13} color={colors.danger} />
                      <Text style={styles.addDamageText}>Add Damage / Crack</Text>
                    </Pressable>
                  </View>
                  {elev.damages.map((d) => (
                    <DamageRecordCard
                      key={d.id}
                      record={d}
                      damageTypes={DAMAGE_TYPES}
                      onUpdate={updateDamage}
                      onDelete={deleteDamage}
                      onCapture={captureDamagePhoto}
                    />
                  ))}
                  {elev.damages.length === 0 && (
                    <Text style={styles.emptyText}>No records yet — tap “Add Damage / Crack”.</Text>
                  )}
                </View>
              )}
            </Card>

            {/* F–I. Observation groups */}
            <Card>
              <SectionLabel>F. Cladding Observations</SectionLabel>
              <ChipMultiSelect options={CLADDING_OBS} selected={elev.claddingObs} onToggle={(v) => toggleArr('claddingObs', v)} />
            </Card>
            <Card>
              <SectionLabel>G. Windows / Doors Observations</SectionLabel>
              <ChipMultiSelect options={WINDOW_DOOR_OBS} selected={elev.windowDoorObs} onToggle={(v) => toggleArr('windowDoorObs', v)} />
            </Card>
            <Card>
              <SectionLabel>H. Eaves Observations</SectionLabel>
              <ChipMultiSelect options={EAVES_OBS} selected={elev.eavesObs} onToggle={(v) => toggleArr('eavesObs', v)} />
            </Card>
            <Card>
              <SectionLabel>I. Downpipes / Gutters Observations</SectionLabel>
              <ChipMultiSelect options={DOWNPIPE_GUTTER_OBS} selected={elev.downpipeGutterObs} onToggle={(v) => toggleArr('downpipeGutterObs', v)} />
            </Card>

            {/* J. Inspector Notes */}
            <Card>
              <SectionLabel>J. Inspector Notes</SectionLabel>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Add observations, findings, or recommendations..."
                placeholderTextColor={colors.textMuted}
                value={elev.notes}
                onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{elev.notes.length}/500</Text>
            </Card>

            {/* K. Additional Photographs */}
            <Card>
              <SectionLabel>K. Additional Photographs</SectionLabel>
              <Text style={styles.helper}>{elev.photos.length} linked to {ELEVATION_LABELS[activeTab]} elevation</Text>
              <PhotoStrip photos={elev.photos} onCapture={captureElevationPhoto} />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / ELEVATIONS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/{ELEVATIONS.length} elevations</Text>
        </View>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={() => show('Draft saved')} />
          <Button label="Back" variant="outline" leftIcon="chevron-back" fitContent onPress={onBack} />
        </View>
        <Button
          label={
            elev.status === 'complete'
              ? `${ELEVATION_LABELS[activeTab]} Complete`
              : `Complete ${ELEVATION_LABELS[activeTab]} Elevation`
          }
          variant={elev.status === 'complete' ? 'successGradient' : 'primaryGradient'}
          leftIcon="checkmark"
          onPress={completeElevation}
        />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Fixed tab strip */
  tabStrip: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.headerGradientFrom },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tabDot: { width: 7, height: 7, borderRadius: 4 },
  tabText: { ...typography.caption, color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },

  /* Body */
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },

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

  gateSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  recordsLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  addDamageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF7F7',
  },
  addDamageText: { fontSize: 11, fontWeight: '700', color: colors.danger },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

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
