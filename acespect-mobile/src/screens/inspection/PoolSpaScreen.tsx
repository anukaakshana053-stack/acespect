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
interface PoolItem {
  id: number;
  name: string;
  status: ItemStatus;
  available: 'yes' | 'no' | null;
  position: string[];
  poolType: string;
  construction: string[];
  pavingType: string[];
  fenceType: string[];
  fenceSafety: string;
  condition: string;
  obstructions: string[];
  hasDamage: 'yes' | 'no' | null;
  damages: DamageRecord[];
  drainageObs: string[];
  notes: string;
  photos: CapturedPhoto[];
}

/* ─── Option data ──────────────────────────────────────────────────── */
const POSITIONS = ['Front', 'Left', 'Rear', 'Right'];
const POOL_TYPES = ['Swimming Pool', 'Spa', 'Pool & Spa Combination', 'Decorative Water Feature', 'Other'];
const CONSTRUCTIONS = ['Fibreglass', 'Concrete', 'Concrete & Tile', 'Vinyl Liner', 'Rendered Finish', 'Other'];
const PAVING_TYPES = ['Tiles', 'Concrete', 'Terracotta', 'Brick Paving', 'Stone Paving', 'Timber Decking', 'Other'];
const FENCE_TYPES = ['Metal Fence', 'Glass Panels', 'Timber Fence', 'Aluminium Fence', 'Masonry Fence', 'Other'];
const OBSTRUCTIONS = ['Vegetation', 'Stored Goods', 'Outdoor Furniture', 'Pool Cover', 'Limited Access', 'Other'];
const DAMAGE_TYPES = ['Crack', 'Subsidence', 'Gap', 'Hole', 'Chipping', 'Surface Damage', 'Tile Damage', 'Movement', 'Rust', 'Other'];
const DRAINAGE_OBS = ['Water Leakage Observed', 'Ponding Observed', 'Drainage Issue', 'Water Staining', 'No Issues Observed'];

const FENCE_SAFETY: ColorOption[] = [
  { value: 'okay', label: 'Appears to be Okay', color: '#16A34A' },
  { value: 'not-safe', label: 'Does Not Appear to be Safe', color: '#DC2626' },
  { value: 'not-observed', label: 'Could Not Be Fully Observed', color: '#D97706' },
];
const CONDITIONS: ColorOption[] = [
  { value: 'new', label: 'New', color: '#0EA5E9' },
  { value: 'satisfactory', label: 'Satisfactory', color: '#16A34A' },
  { value: 'fair', label: 'Fair', color: '#3B82F6' },
  { value: 'average', label: 'Average', color: '#D97706' },
  { value: 'poor', label: 'Poor', color: '#DC2626' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));
const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]));

function makePool(id: number, name: string): PoolItem {
  return {
    id,
    name,
    status: 'pending',
    available: null,
    position: [],
    poolType: '',
    construction: [],
    pavingType: [],
    fenceType: [],
    fenceSafety: '',
    condition: '',
    obstructions: [],
    hasDamage: null,
    damages: [],
    drainageObs: [],
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

export function PoolSpaScreen({ onBack, onComplete, onGoHome }: Props) {
  const [items, setItems] = useState<PoolItem[]>([makePool(1, 'Pool / Spa 1')]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const item = items[currentIdx];

  const saveToDraft = () => {
    const present = items.filter((it) => it.available === 'yes');
    const reportText =
      present
        .map((it) => {
          let s = `${it.name}: ${(it.poolType || 'pool/spa').toLowerCase()}`;
          if (it.construction.length) s += `, ${it.construction.join('/').toLowerCase()} construction`;
          if (it.condition) s += `, in ${(CONDITION_LABEL[it.condition] || it.condition).toLowerCase()} condition`;
          s += '.';
          const safety = FENCE_SAFETY.find((f) => f.value === it.fenceSafety);
          if (safety) s += ` Pool fence ${safety.label.toLowerCase()}.`;
          if (it.notes) s += ` ${it.notes}`;
          return s;
        })
        .join(' ') ||
      (items.some((it) => it.available === 'no') ? 'No pool or spa present.' : 'Pool / spa not recorded.');
    const damages = items.flatMap((it) =>
      it.hasDamage === 'yes'
        ? it.damages.map((d) => ({
            type: d.damageType || 'Damage',
            location: d.location,
            direction: d.direction,
            widthMm: parseFloat(d.widthMm) || 0,
            lengthMm: parseFloat(d.lengthMm) || 0,
            notes: d.notes,
            photos: d.photos.map((p) => p.uri),
          }))
        : [],
    );
    const photos = items.flatMap((it) => it.photos.map((p) => p.uri));
    draft.setSection({
      key: 'pool_spa',
      name: 'Pool / Spa',
      icon: '🏊',
      order: 8,
      status: 'complete',
      reportText,
      fields: { items: String(items.length) },
      photos,
      damages,
    });
  };

  const upd = (updates: Partial<PoolItem>) =>
    setItems((prev) =>
      prev.map((it, i) => (i === currentIdx ? { ...it, ...updates, status: it.status === 'pending' ? 'in-progress' : it.status } : it)),
    );

  const toggleArr = (
    field: 'position' | 'construction' | 'pavingType' | 'fenceType' | 'obstructions' | 'drainageObs',
    val: string,
  ) => {
    const cur = item[field];
    upd({ [field]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const addDamage = () => upd({ damages: [...item.damages, makeDamageRecord(Math.max(0, ...item.damages.map((d) => d.id)) + 1)] });
  const updateDamage = (id: number, u: Partial<DamageRecord>) => upd({ damages: item.damages.map((d) => (d.id === id ? { ...d, ...u } : d)) });
  const deleteDamage = (id: number) => upd({ damages: item.damages.filter((d) => d.id !== id) });

  async function captureDamagePhoto(id: number, kind: 'camera' | 'library') {
    const photo = kind === 'camera'
      ? await takePhoto({ sectionKey: 'pool_spa', category: 'damage' })
      : await pickFromLibrary({ sectionKey: 'pool_spa', category: 'damage' });
    if (!photo) return;
    const target = item.damages.find((d) => d.id === id);
    if (target) updateDamage(id, { photos: [...target.photos, photo] });
  }

  async function captureItemPhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: 'pool_spa', sortOrder: item.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...item.photos, photo] });
  }

  function addItem() {
    const n = items.length + 1;
    setItems((prev) => [...prev, makePool(n, `Pool / Spa ${n}`)]);
    setCurrentIdx(items.length);
  }

  function completeItem() {
    setItems((prev) => prev.map((it, i) => (i === currentIdx ? { ...it, status: 'complete' } : it)));
    const next = items.findIndex((it, i) => i !== currentIdx && it.status !== 'complete');
    if (next >= 0) {
      setCurrentIdx(next);
      show(`${item.name} complete`);
    } else {
      show('All pool / spa items complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = items.filter((it) => it.status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow="POOL / SPA"
        title={item.name}
        status={item.status}
        conditionLabel={item.condition ? CONDITION_LABEL[item.condition] : undefined}
        conditionColor={item.condition ? CONDITION_COLOR[item.condition] : undefined}
        pager={{
          index: currentIdx,
          total: items.length,
          unit: 'items',
          onPrev: () => currentIdx > 0 && setCurrentIdx((i) => i - 1),
          onNext: () => currentIdx < items.length - 1 && setCurrentIdx((i) => i + 1),
        }}
        onBack={onBack}
        onSave={() => show('Draft saved')}
        onHome={onGoHome}
      />

      {/* Item strip */}
      <View style={styles.strip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
          {items.map((it, i) => {
            const active = i === currentIdx;
            return (
              <Pressable key={it.id} onPress={() => setCurrentIdx(i)} style={[styles.stripChip, active && styles.stripChipActive]}>
                {it.status === 'complete' ? (
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                ) : (
                  <View style={[styles.stripDot, { backgroundColor: it.status === 'in-progress' ? colors.barBlue : colors.stepInactive }]} />
                )}
                <Text style={[styles.stripText, active && styles.stripTextActive]}>{it.name}</Text>
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
        {/* Available */}
        <Card>
          <SectionLabel>Pool / Spa Available</SectionLabel>
          <YesNoToggle value={item.available} onChange={(v) => upd({ available: v })} />
        </Card>

        {item.available === 'no' && (
          <View style={styles.notPresent}>
            <Ionicons name="water-outline" size={22} color={colors.textMuted} />
            <View style={styles.flex1}>
              <Text style={styles.notPresentTitle}>Not Present</Text>
              <Text style={styles.notPresentText}>No pool or spa was observed at this property.</Text>
            </View>
          </View>
        )}

        {item.available === 'yes' && (
          <>
            <Card>
              <SectionLabel>A. Structure Position</SectionLabel>
              <ChipMultiSelect options={POSITIONS} selected={item.position} onToggle={(v) => toggleArr('position', v)} />
            </Card>

            <Card>
              <SectionLabel>B. Pool / Spa Type</SectionLabel>
              <PillSelect options={POOL_TYPES} value={item.poolType} onChange={(v) => upd({ poolType: v })} />
            </Card>

            <Card>
              <SectionLabel>C. Pool / Spa Construction</SectionLabel>
              <ChipMultiSelect options={CONSTRUCTIONS} selected={item.construction} onToggle={(v) => toggleArr('construction', v)} />
            </Card>

            <Card>
              <SectionLabel>D. Pool / Spa Paving Type</SectionLabel>
              <ChipMultiSelect options={PAVING_TYPES} selected={item.pavingType} onToggle={(v) => toggleArr('pavingType', v)} />
            </Card>

            <Card>
              <SectionLabel>E. Pool Fence Type</SectionLabel>
              <ChipMultiSelect options={FENCE_TYPES} selected={item.fenceType} onToggle={(v) => toggleArr('fenceType', v)} />
            </Card>

            <Card>
              <SectionLabel>F. Pool Fence Safety Assessment</SectionLabel>
              <ColorOptionList options={FENCE_SAFETY} value={item.fenceSafety} onChange={(v) => upd({ fenceSafety: v })} />
            </Card>

            <Card>
              <SectionLabel>G. General Condition</SectionLabel>
              <ColorOptionList options={CONDITIONS} value={item.condition} onChange={(v) => upd({ condition: v })} />
            </Card>

            <Card>
              <SectionLabel>H. Visibility / Access Obstruction</SectionLabel>
              <ChipMultiSelect options={OBSTRUCTIONS} selected={item.obstructions} onToggle={(v) => toggleArr('obstructions', v)} />
            </Card>

            {/* I. Damage / Crack Records — gated behind Yes/No */}
            <Card>
              <SectionLabel>I. Damage / Crack Records</SectionLabel>
              <Text style={styles.helper}>Is there any notable damage or cracking?</Text>
              <YesNoToggle value={item.hasDamage} onChange={(v) => upd({ hasDamage: v })} />

              {item.hasDamage === 'yes' && (
                <View style={styles.gateSection}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recordsLabel}>
                      {item.damages.length} record{item.damages.length !== 1 ? 's' : ''}
                    </Text>
                    <Pressable onPress={addDamage} style={styles.addDamageBtn}>
                      <Ionicons name="add" size={13} color={colors.danger} />
                      <Text style={styles.addDamageText}>Add Damage / Crack</Text>
                    </Pressable>
                  </View>
                  {item.damages.map((d) => (
                    <DamageRecordCard
                      key={d.id}
                      record={d}
                      damageTypes={DAMAGE_TYPES}
                      onUpdate={updateDamage}
                      onDelete={deleteDamage}
                      onCapture={captureDamagePhoto}
                    />
                  ))}
                  {item.damages.length === 0 && (
                    <Text style={styles.emptyText}>No records yet — tap “Add Damage / Crack”.</Text>
                  )}
                </View>
              )}
            </Card>

            <Card>
              <SectionLabel>J. Drainage / Moisture Observations</SectionLabel>
              <ChipMultiSelect options={DRAINAGE_OBS} selected={item.drainageObs} onToggle={(v) => toggleArr('drainageObs', v)} />
            </Card>

            <Card>
              <SectionLabel>K. Inspector Notes</SectionLabel>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Add observations, findings, or recommendations..."
                placeholderTextColor={colors.textMuted}
                value={item.notes}
                onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{item.notes.length}/500</Text>
            </Card>

            <Card>
              <SectionLabel>L. Additional Photographs</SectionLabel>
              <Text style={styles.helper}>{item.photos.length} linked to {item.name}</Text>
              <PhotoStrip photos={item.photos} onCapture={captureItemPhoto} />
            </Card>
          </>
        )}
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
          <Button label="Add" variant="outline" leftIcon="add" fitContent onPress={addItem} />
        </View>
        <Button
          label={item.status === 'complete' ? `${item.name} Complete` : `Complete ${item.name}`}
          variant={item.status === 'complete' ? 'successGradient' : 'primaryGradient'}
          leftIcon="checkmark"
          onPress={completeItem}
        />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
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
