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
  PhotoStrip,
  PillSelect,
  SectionGradientHeader,
  SectionLabel,
  Toast,
  YesNoToggle,
  makeCrack,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
interface StructureItem {
  id: number;
  location: string;
  name: string;
  status: ItemStatus;
  structureType: string;
  material: string;
  condition: string;
  obstructions: string[];
  obstructionOther: string;
  notableDamage: 'yes' | 'no' | null;
  notableCracking: 'yes' | 'no' | null;
  cracks: CrackEntry[];
  notes: string;
  photos: CapturedPhoto[];
}

/** Per-section configuration (Fences vs Retaining Walls vs …). */
export interface StructureConfig {
  eyebrow: string;
  sectionKey: string;
  /** Item noun, e.g. "Fencing" / "Retaining Wall". */
  itemNoun: string;
  /** Short noun for the complete button, e.g. "Fence" / "Wall". */
  completeNoun: string;
  /** Pager unit label, e.g. "fences" / "walls". */
  unit: string;
  structureTypes: string[];
}

/* ─── Shared option data ───────────────────────────────────────────── */
const LOCATIONS = ['Front', 'Left', 'Right', 'Rear'];
const MATERIALS = [
  'Brick / Masonry', 'Timber', 'Metal / Steel', 'Aluminium', 'Colorbond',
  'Glass', 'Concrete', 'Stone / Rock', 'Rendered Block', 'Other',
];
const CONDITIONS: ColorOption[] = [
  { value: 'New', label: 'New', color: '#16A34A' },
  { value: 'Satisfactory', label: 'Satisfactory', color: colors.barBlue },
  { value: 'Fair', label: 'Fair', color: '#F59E0B' },
  { value: 'Poor', label: 'Poor', color: '#EF4444' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));
const OBSTRUCTIONS = ['Vegetation', 'Overgrown shrubs', 'Parked vehicle', 'Restricted access', 'Stored items', 'Other (specify)'];

const FENCE_TYPES = [
  'Colorbond Fence', 'Timber Paling', 'Brick Fence', 'Brick Pier & Panel',
  'Glass / Frameless', 'Aluminium / Metal', 'Chain Wire / Cyclone', 'Other',
];
const WALL_TYPES = [
  'Timber Sleeper', 'Concrete Block', 'Rock / Boulder', 'Brick Wall',
  'Steel Sheet', 'Corten Steel', 'Gabion', 'Other',
];

function makeItem(id: number, location: string, noun: string): StructureItem {
  return {
    id,
    location,
    name: `${location} ${noun}`,
    status: 'pending',
    structureType: '',
    material: '',
    condition: '',
    obstructions: [],
    obstructionOther: '',
    notableDamage: null,
    notableCracking: null,
    cracks: [makeCrack(1)],
    notes: '',
    photos: [],
  };
}

/* ─── Generic screen ───────────────────────────────────────────────── */
interface Props {
  config: StructureConfig;
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

function StructureInspectionScreen({ config, onBack, onComplete, onGoHome }: Props) {
  const [items, setItems] = useState<StructureItem[]>(
    LOCATIONS.map((loc, i) => makeItem(i + 1, loc, config.itemNoun)),
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const item = items[activeIdx];

  const saveToDraft = () => {
    const sectionName = config.unit.charAt(0).toUpperCase() + config.unit.slice(1);
    const filled = items.filter((it) => it.structureType || it.material || it.condition || it.notes);
    const reportText =
      filled
        .map(
          (it) =>
            `The ${it.location.toLowerCase()} ${config.completeNoun.toLowerCase()} is constructed of ${(
              it.material ||
              it.structureType ||
              'unspecified material'
            ).toLowerCase()} and is in ${(it.condition || 'unspecified').toLowerCase()} condition.${
              it.notes ? ' ' + it.notes : ''
            }`,
        )
        .join(' ') || `No ${config.unit} recorded.`;
    const damages = items.flatMap((it) =>
      it.cracks
        .filter((c) => c.location || c.direction || c.widthMm || c.lengthMm)
        .map((c) => ({
          type: 'Crack',
          location: c.location,
          direction: c.direction,
          widthMm: parseFloat(c.widthMm) || 0,
          lengthMm: parseFloat(c.lengthMm) || 0,
          notes: c.startingPoint,
        })),
    );
    draft.setSection({
      key: config.sectionKey,
      name: sectionName,
      icon: config.sectionKey === 'fences' ? '🪵' : '🧱',
      order: config.sectionKey === 'fences' ? 3 : 7,
      status: 'complete',
      reportText,
      fields: { locations: filled.map((it) => it.location).join(', ') },
      damages,
    });
  };

  const upd = (updates: Partial<StructureItem>) =>
    setItems((prev) =>
      prev.map((it, i) =>
        i === activeIdx ? { ...it, ...updates, status: it.status === 'pending' ? 'in-progress' : it.status } : it,
      ),
    );

  const toggleObs = (o: string) =>
    upd({ obstructions: item.obstructions.includes(o) ? item.obstructions.filter((x) => x !== o) : [...item.obstructions, o] });

  const addCrack = () => upd({ cracks: [...item.cracks, makeCrack(Math.max(...item.cracks.map((c) => c.id), 0) + 1)] });
  const updateCrack = (id: number, u: Partial<CrackEntry>) =>
    upd({ cracks: item.cracks.map((c) => (c.id === id ? { ...c, ...u } : c)) });
  const removeCrack = (id: number) => item.cracks.length > 1 && upd({ cracks: item.cracks.filter((c) => c.id !== id) });

  async function capturePhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: config.sectionKey, sortOrder: item.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...item.photos, photo] });
  }

  function addItem() {
    const n = items.length + 1;
    setItems((prev) => [...prev, { ...makeItem(Date.now(), 'Front', config.itemNoun), name: `Additional ${config.completeNoun} ${n}` }]);
    setActiveIdx(items.length);
  }

  function completeItem() {
    setItems((prev) => prev.map((it, i) => (i === activeIdx ? { ...it, status: 'complete' } : it)));
    const next = items.findIndex((it, i) => i !== activeIdx && it.status !== 'complete');
    if (next >= 0) {
      setActiveIdx(next);
      show(`${item.location} ${config.completeNoun.toLowerCase()} complete`);
    } else {
      show('All complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = items.filter((it) => it.status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow={config.eyebrow}
        title={item.name}
        status={item.status}
        conditionLabel={item.condition || undefined}
        conditionColor={item.condition ? CONDITION_COLOR[item.condition] : undefined}
        pager={{
          index: activeIdx,
          total: items.length,
          unit: config.unit,
          onPrev: () => activeIdx > 0 && setActiveIdx((i) => i - 1),
          onNext: () => activeIdx < items.length - 1 && setActiveIdx((i) => i + 1),
        }}
        onBack={onBack}
        onSave={() => show('Draft saved')}
        onHome={onGoHome}
      />

      {/* Location strip */}
      <View style={styles.strip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
          {items.map((it, i) => {
            const active = i === activeIdx;
            return (
              <Pressable key={it.id} onPress={() => setActiveIdx(i)} style={[styles.stripChip, active && styles.stripChipActive]}>
                {it.status === 'complete' ? (
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                ) : (
                  <View style={[styles.stripDot, { backgroundColor: it.status === 'in-progress' ? colors.barBlue : colors.stepInactive }]} />
                )}
                <Text style={[styles.stripText, active && styles.stripTextActive]}>{it.location}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={addItem} style={styles.addChip}>
            <Ionicons name="add" size={13} color={colors.barBlue} />
            <Text style={styles.addChipText}>Add</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Structure Type */}
        <Card>
          <SectionLabel n={1}>Structure Type</SectionLabel>
          <PillSelect options={config.structureTypes} value={item.structureType} onChange={(v) => upd({ structureType: v })} />
        </Card>

        {/* 2. Orientation */}
        <Card>
          <SectionLabel n={2}>Orientation</SectionLabel>
          <PillSelect options={LOCATIONS} value={item.location} onChange={(v) => upd({ location: v, name: `${v} ${config.itemNoun}` })} />
        </Card>

        {/* 3. Material */}
        <Card>
          <SectionLabel n={3}>Material</SectionLabel>
          <PillSelect options={MATERIALS} value={item.material} onChange={(v) => upd({ material: v })} />
        </Card>

        {/* 4. Condition */}
        <Card>
          <SectionLabel n={4}>Condition</SectionLabel>
          <ColorOptionList options={CONDITIONS} value={item.condition} onChange={(v) => upd({ condition: v })} />
        </Card>

        {/* 5. Visibility Obstructions */}
        <Card>
          <SectionLabel n={5}>Visibility Obstructions</SectionLabel>
          <Text style={styles.helper}>Select all that apply</Text>
          <ChipMultiSelect options={OBSTRUCTIONS} selected={item.obstructions} onToggle={toggleObs} />
          {item.obstructions.includes('Other (specify)') && (
            <FieldInput
              style={styles.mt}
              placeholder="Enter details..."
              value={item.obstructionOther}
              onChangeText={(v) => upd({ obstructionOther: v })}
            />
          )}
        </Card>

        {/* 6 + 7. Notable Damage + Cracking */}
        <Card>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <SectionLabel n={6}>Notable Damage</SectionLabel>
              <YesNoToggle value={item.notableDamage} onChange={(v) => upd({ notableDamage: v })} />
            </View>
            <View style={styles.flex1}>
              <SectionLabel n={7}>Notable Cracking</SectionLabel>
              <YesNoToggle value={item.notableCracking} onChange={(v) => upd({ notableCracking: v })} />
            </View>
          </View>

          {item.notableCracking === 'yes' && (
            <View style={styles.crackSection}>
              <View style={styles.cardHeaderRow}>
                <SectionLabel n={8}>Crack Details</SectionLabel>
                <Pressable onPress={addCrack} style={styles.addCrackBtn}>
                  <Ionicons name="add" size={13} color={colors.barBlue} />
                  <Text style={styles.addCrackText}>Add Crack</Text>
                </Pressable>
              </View>
              {item.cracks.map((c, i) => (
                <CrackCard
                  key={c.id}
                  crack={c}
                  index={i}
                  onUpdate={(u) => updateCrack(c.id, u)}
                  onRemove={() => removeCrack(c.id)}
                  canRemove={item.cracks.length > 1}
                />
              ))}
            </View>
          )}
        </Card>

        {/* 9. Inspector Notes */}
        <Card>
          <SectionLabel n={9}>Inspector Notes / Observations</SectionLabel>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe structure condition, cracking patterns, safety observations..."
            placeholderTextColor={colors.textMuted}
            value={item.notes}
            onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{item.notes.length}/500</Text>
        </Card>

        {/* 10. Photographs */}
        <Card>
          <SectionLabel n={10}>Photographs</SectionLabel>
          <Text style={styles.helper}>{item.photos.length} linked to {item.name}</Text>
          <PhotoStrip photos={item.photos} onCapture={capturePhoto} />
        </Card>
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / items.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/{items.length} done</Text>
        </View>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={() => show('Draft saved')} />
          <Button label={`Add ${config.completeNoun}`} variant="outline" leftIcon="add" fitContent onPress={addItem} />
        </View>
        <Button
          label={
            item.status === 'complete'
              ? `${item.location} ${config.completeNoun} Complete`
              : `Complete ${item.location} ${config.completeNoun}`
          }
          variant={item.status === 'complete' ? 'successGradient' : 'primaryGradient'}
          leftIcon="checkmark"
          onPress={completeItem}
        />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

/* ─── Configured exports ───────────────────────────────────────────── */
const FENCES_CONFIG: StructureConfig = {
  eyebrow: 'FENCES',
  sectionKey: 'fences',
  itemNoun: 'Fencing',
  completeNoun: 'Fence',
  unit: 'fences',
  structureTypes: FENCE_TYPES,
};

const WALLS_CONFIG: StructureConfig = {
  eyebrow: 'RETAINING WALLS',
  sectionKey: 'retaining_walls',
  itemNoun: 'Retaining Wall',
  completeNoun: 'Wall',
  unit: 'walls',
  structureTypes: WALL_TYPES,
};

type SectionScreenProps = { onBack: () => void; onComplete: () => void; onGoHome: () => void };

export function FencesScreen(props: SectionScreenProps) {
  return <StructureInspectionScreen config={FENCES_CONFIG} {...props} />;
}

export function RetainingWallsScreen(props: SectionScreenProps) {
  return <StructureInspectionScreen config={WALLS_CONFIG} {...props} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

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

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex1: { flex: 1 },
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

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.success },
  progressText: { ...typography.caption, color: colors.textMuted },
});
