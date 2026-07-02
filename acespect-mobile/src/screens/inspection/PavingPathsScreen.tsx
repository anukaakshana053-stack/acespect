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
  CrackCard,
  CrackEntry,
  FieldInput,
  ItemStatus,
  MiniLabel,
  PhotoStrip,
  PillSelect,
  SectionGradientHeader,
  SectionLabel,
  SeverityRow,
  Toast,
  YesNoToggle,
  makeCrack,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
interface PavingArea {
  id: number;
  name: string;
  status: ItemStatus;
  pathType: string;
  condition: string;
  defects: string[];
  defectOther: string;
  drainage: string;
  drainageNote: string;
  notableCracking: 'yes' | 'no' | null;
  cracks: CrackEntry[];
  notes: string;
  photos: CapturedPhoto[];
}

/* ─── Option data ──────────────────────────────────────────────────── */
const PATH_TYPES = [
  'Concrete', 'Pavers / Clay', 'Exposed Aggregate', 'Asphalt',
  'Gravel / Crushed Rock', 'Bluestone', 'Slate / Natural Stone', 'Timber Decking', 'Other',
];

const CONDITIONS: ColorOption[] = [
  { value: 'Satisfactory', label: 'Satisfactory', color: '#16A34A' },
  { value: 'Fair', label: 'Fair', color: '#84CC16' },
  { value: 'Average', label: 'Average', color: '#F59E0B' },
  { value: 'Poor', label: 'Poor', color: '#EF4444' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));

const DEFECTS = [
  'Cracking', 'Lifting / Heaving', 'Settlement', 'Depth / Uneven',
  'Litter / Stains', 'No defects', 'Shallow Wear', 'Spalling / Pitting', 'Other (specify)',
];

const DRAINAGE: ColorOption[] = [
  { value: 'No Issue', label: 'No Issue', color: '#16A34A' },
  { value: 'Minor Issue', label: 'Minor Issue', color: '#F59E0B' },
  { value: 'Major Issue', label: 'Major Issue', color: '#E63329' },
];

const DEFAULT_AREA_NAMES = [
  'Front Paths & Paving',
  'Left Side Paths & Paving',
  'Rear Paths & Paving',
  'Right Side Paths & Paving',
];

function shortName(name: string) {
  return name.replace(' Paths & Paving', '').replace(' Side', '');
}

function makeArea(id: number, name: string): PavingArea {
  return {
    id,
    name,
    status: 'pending',
    pathType: '',
    condition: '',
    defects: [],
    defectOther: '',
    drainage: '',
    drainageNote: '',
    notableCracking: null,
    cracks: [makeCrack(1)],
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

export function PavingPathsScreen({ onBack, onComplete, onGoHome }: Props) {
  const [areas, setAreas] = useState<PavingArea[]>(DEFAULT_AREA_NAMES.map((n, i) => makeArea(i + 1, n)));
  const [currentIdx, setCurrentIdx] = useState(0);
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const area = areas[currentIdx];

  const saveToDraft = () => {
    const filled = areas.filter((a) => a.pathType || a.condition || a.defects.length || a.notes || a.photos.length);
    const reportText =
      filled
        .map((a) => {
          let s = `The ${shortName(a.name).toLowerCase()} paths/paving are ${(a.pathType || 'unspecified').toLowerCase()} in ${(a.condition || 'unspecified').toLowerCase()} condition`;
          if (a.defects.length) s += `, with ${a.defects.join(', ').toLowerCase()}`;
          s += '.';
          if (a.drainage) s += ` Drainage: ${a.drainage.toLowerCase()}.`;
          if (a.drainageNote) s += ` ${a.drainageNote}`;
          if (a.notes) s += ` ${a.notes}`;
          return s;
        })
        .join(' ') || 'No paving or paths recorded.';
    const damages = areas.flatMap((a) =>
      a.notableCracking === 'yes'
        ? a.cracks
            .filter((c) => c.location || c.direction || c.widthMm || c.lengthMm)
            .map((c) => ({
              type: 'Crack',
              location: c.location,
              direction: c.direction,
              widthMm: parseFloat(c.widthMm) || 0,
              lengthMm: parseFloat(c.lengthMm) || 0,
              notes: c.startingPoint,
            }))
        : [],
    );
    const photos = areas.flatMap((a) => a.photos.map((p) => p.uri));
    draft.setSection({
      key: 'paving_paths',
      name: 'Paving & Paths',
      icon: '🚶',
      order: 4,
      status: 'complete',
      reportText,
      fields: { areas: String(filled.length) },
      photos,
      damages,
    });
  };

  const upd = (updates: Partial<PavingArea>) =>
    setAreas((prev) =>
      prev.map((a, i) =>
        i === currentIdx ? { ...a, ...updates, status: a.status === 'pending' ? 'in-progress' : a.status } : a,
      ),
    );

  const toggleDefect = (d: string) =>
    upd({ defects: area.defects.includes(d) ? area.defects.filter((x) => x !== d) : [...area.defects, d] });

  const addCrack = () => upd({ cracks: [...area.cracks, makeCrack(Math.max(...area.cracks.map((c) => c.id), 0) + 1)] });
  const updateCrack = (id: number, u: Partial<CrackEntry>) =>
    upd({ cracks: area.cracks.map((c) => (c.id === id ? { ...c, ...u } : c)) });
  const removeCrack = (id: number) => area.cracks.length > 1 && upd({ cracks: area.cracks.filter((c) => c.id !== id) });

  async function capturePhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: 'paving_paths', sortOrder: area.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...area.photos, photo] });
  }

  function addArea() {
    const n = areas.length + 1;
    setAreas((prev) => [...prev, makeArea(n, `Additional Area ${n}`)]);
    setCurrentIdx(areas.length);
  }

  function completeArea() {
    setAreas((prev) => prev.map((a, i) => (i === currentIdx ? { ...a, status: 'complete' } : a)));
    const next = areas.findIndex((a, i) => i !== currentIdx && a.status !== 'complete');
    if (next >= 0) {
      setCurrentIdx(next);
      show(`${shortName(area.name)} paths complete`);
    } else {
      show('All paths complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = areas.filter((a) => a.status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow="EXTERNAL PATHS & PAVING"
        title={area.name}
        status={area.status}
        conditionLabel={area.condition || undefined}
        conditionColor={area.condition ? CONDITION_COLOR[area.condition] : undefined}
        pager={{
          index: currentIdx,
          total: areas.length,
          unit: 'areas',
          onPrev: () => currentIdx > 0 && setCurrentIdx((i) => i - 1),
          onNext: () => currentIdx < areas.length - 1 && setCurrentIdx((i) => i + 1),
        }}
        onBack={onBack}
        onSave={() => show('Draft saved')}
        onHome={onGoHome}
      />

      {/* Area selector strip */}
      <View style={styles.strip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
          {areas.map((a, i) => {
            const active = i === currentIdx;
            return (
              <Pressable key={a.id} onPress={() => setCurrentIdx(i)} style={[styles.stripChip, active && styles.stripChipActive]}>
                {a.status === 'complete' ? (
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                ) : (
                  <View style={[styles.stripDot, { backgroundColor: a.status === 'in-progress' ? colors.barBlue : colors.stepInactive }]} />
                )}
                <Text style={[styles.stripText, active && styles.stripTextActive]}>{shortName(a.name)}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={addArea} style={styles.addChip}>
            <Ionicons name="add" size={13} color={colors.barBlue} />
            <Text style={styles.addChipText}>Add Area</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Path / Paving Type */}
        <Card>
          <SectionLabel n={1}>Path / Paving Type</SectionLabel>
          <PillSelect options={PATH_TYPES} value={area.pathType} onChange={(v) => upd({ pathType: v })} />
        </Card>

        {/* 2. General Condition */}
        <Card>
          <SectionLabel n={2}>General Condition</SectionLabel>
          <ColorOptionList options={CONDITIONS} value={area.condition} onChange={(v) => upd({ condition: v })} />
        </Card>

        {/* 3. Surface Defects */}
        <Card>
          <SectionLabel n={3}>Surface Defects / Conditions</SectionLabel>
          <Text style={styles.helper}>Select all that apply</Text>
          <ChipMultiSelect options={DEFECTS} selected={area.defects} onToggle={toggleDefect} />
          {area.defects.includes('Other (specify)') && (
            <FieldInput
              style={styles.mt}
              placeholder="Enter details..."
              value={area.defectOther}
              onChangeText={(v) => upd({ defectOther: v })}
            />
          )}
        </Card>

        {/* 4. Drainage / Fall */}
        <Card>
          <SectionLabel n={4}>Drainage / Fall</SectionLabel>
          <Text style={styles.helper}>Is there any noticeable drainage issue with the paths / paving?</Text>
          <SeverityRow options={DRAINAGE} value={area.drainage} onChange={(v) => upd({ drainage: v })} />
          <FieldInput
            style={[styles.textarea, styles.mt]}
            placeholder="Water pooling, runoff direction, blocked drainage details..."
            value={area.drainageNote}
            onChangeText={(v) => upd({ drainageNote: v })}
            multiline
            textAlignVertical="top"
          />
        </Card>

        {/* 5. Notable Cracking + Crack Details */}
        <Card>
          <View style={styles.cardHeaderRow}>
            <SectionLabel n={5}>Notable Cracking</SectionLabel>
            {area.notableCracking === 'yes' && (
              <View style={styles.crackCountBadge}>
                <Text style={styles.crackCountText}>
                  {area.cracks.length} crack{area.cracks.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.helper}>Is there any noticeable cracking to the path / paving?</Text>
          <YesNoToggle value={area.notableCracking} onChange={(v) => upd({ notableCracking: v })} />

          {area.notableCracking === 'yes' && (
            <View style={styles.crackSection}>
              <View style={styles.cardHeaderRow}>
                <SectionLabel n={6}>Crack Details</SectionLabel>
                <Pressable onPress={addCrack} style={styles.addCrackBtn}>
                  <Ionicons name="add" size={13} color={colors.barBlue} />
                  <Text style={styles.addCrackText}>Add Crack</Text>
                </Pressable>
              </View>
              {area.cracks.map((c, i) => (
                <CrackCard
                  key={c.id}
                  crack={c}
                  index={i}
                  onUpdate={(u) => updateCrack(c.id, u)}
                  onRemove={() => removeCrack(c.id)}
                  canRemove={area.cracks.length > 1}
                />
              ))}
            </View>
          )}
        </Card>

        {/* 7. Inspector Notes */}
        <Card>
          <SectionLabel n={7}>Inspector Notes / Observations</SectionLabel>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe surface defects, cracking patterns, safety observations..."
            placeholderTextColor={colors.textMuted}
            value={area.notes}
            onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{area.notes.length}/500</Text>
        </Card>

        {/* 8. Photographs */}
        <Card>
          <SectionLabel n={8}>Photographs</SectionLabel>
          <Text style={styles.helper}>{area.photos.length} linked to {shortName(area.name)}</Text>
          <PhotoStrip photos={area.photos} onCapture={capturePhoto} />
        </Card>
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / areas.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount} of {areas.length} done</Text>
        </View>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={() => show('Draft saved')} />
          <Button label="Add Area" variant="outline" leftIcon="add" fitContent onPress={addArea} />
        </View>
        <Button
          label={area.status === 'complete' ? `${shortName(area.name)} Complete` : `Complete ${shortName(area.name)} Paths`}
          variant={area.status === 'complete' ? 'successGradient' : 'primaryGradient'}
          leftIcon="checkmark"
          onPress={completeArea}
        />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Area strip */
  strip: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  stripContent: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  stripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stripChipActive: { borderColor: colors.barBlue, backgroundColor: colors.accentBlue },
  stripDot: { width: 8, height: 8, borderRadius: 4 },
  stripText: { ...typography.caption, color: colors.textMuted },
  stripTextActive: { color: colors.barBlue, fontWeight: '700' },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.barBlue,
  },
  addChipText: { ...typography.caption, color: colors.barBlue, fontWeight: '700' },

  /* Body */
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mt: { marginTop: spacing.sm },

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
  textarea: { minHeight: 80 },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },

  crackSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  crackCountBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.primaryTint },
  crackCountText: { fontSize: 10, fontWeight: '700', color: colors.danger },
  addCrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    backgroundColor: colors.accentBlue,
  },
  addCrackText: { fontSize: 11, fontWeight: '700', color: colors.barBlue },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  /* Footer */
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.success },
  progressText: { ...typography.caption, color: colors.textMuted },
});
