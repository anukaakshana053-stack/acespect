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
  FieldInput,
  ItemStatus,
  MiniLabel,
  PhotoStrip,
  PillSelect,
  SectionGradientHeader,
  Toast,
  YesNoToggle,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
interface DamageRecord {
  id: number;
  damageType: string;
  location: string;
  direction: string;
  width: string;
  length: string;
  notes: string;
  photos: CapturedPhoto[];
}

interface GarageItem {
  id: number;
  name: string;
  status: ItemStatus;
  available: 'yes' | 'no' | '';
  attachment: 'attached' | 'separate' | '';
  position: string;
  basementPresent: 'yes' | 'no' | '';
  wallConstruction: string[];
  roofConstruction: string[];
  floorType: string[];
  condition: string;
  obstructions: string[];
  hasDamage: 'yes' | 'no' | null;
  damages: DamageRecord[];
  claddingObs: string[];
  windowsDoorObs: string[];
  eavesObs: string[];
  downpipesObs: string[];
  notes: string;
  photos: CapturedPhoto[];
}

/* ─── Option data ──────────────────────────────────────────────────── */
const POSITIONS = ['Front', 'Left', 'Rear', 'Right'];
const WALL_OPTS = ['Brick', 'Metal', 'Fibre Cement', 'Weatherboard', 'Concrete', 'Timber', 'Other'];
const ROOF_OPTS = ['Metal', 'Colorbond', 'Tiles', 'Fibre Cement', 'Polycarbonate', 'Other'];
const FLOOR_OPTS = ['Concrete', 'Hardstand', 'Pavers', 'Gravel', 'Timber', 'Other'];
const OBSTRUCTION_OPTS = ['Shelving', 'Stored Goods', 'Parked Vehicle', 'Limited Access', 'Other'];
const DAMAGE_TYPES = ['Crack', 'Subsidence', 'Gap', 'Hole', 'Chipping', 'Rust', 'Timber Decay', 'Surface Damage', 'Movement', 'Other'];
const DIRECTIONS = ['Vertical', 'Horizontal', 'Diagonal'];
const CLADDING_OPTS = ['Paint Weathered', 'Paint Flaking', 'Timber Cracked', 'Decay Observed', 'Gaps at Joints', 'Other'];
const WINDOWS_OPTS = ['Paint Flaking', 'Gaps Around Frames', 'Broken Glazing', 'Frame Decay', 'Delamination', 'Other'];
const EAVES_OPTS = ['Water Stains', 'Dark Mould', 'Gaps at Joints', 'Cracked Linings', 'Other'];
const DOWNPIPES_OPTS = ['Sagging', 'Loose Connection', 'Not Connected to Stormwater', 'Rust', 'Overflow Signs', 'Other'];

const CONDITIONS: ColorOption[] = [
  { value: 'new', label: 'New', color: '#0EA5E9' },
  { value: 'satisfactory', label: 'Satisfactory', color: '#16A34A' },
  { value: 'fair', label: 'Fair', color: colors.barBlue },
  { value: 'average', label: 'Average', color: '#D97706' },
  { value: 'poor', label: 'Poor', color: '#E63329' },
];
const CONDITION_COLOR: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.color]));
const CONDITION_LABEL: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.label]));

let nextDamageId = 1;

function makeGarage(id: number, name: string): GarageItem {
  return {
    id,
    name,
    status: 'pending',
    available: '',
    attachment: '',
    position: '',
    basementPresent: '',
    wallConstruction: [],
    roofConstruction: [],
    floorType: [],
    condition: '',
    obstructions: [],
    hasDamage: null,
    damages: [],
    claddingObs: [],
    windowsDoorObs: [],
    eavesObs: [],
    downpipesObs: [],
    notes: '',
    photos: [],
  };
}

/* ─── Section label with letter badge ──────────────────────────────── */
function SL({ letter, children }: { letter: string; children: React.ReactNode }) {
  return (
    <View style={styles.slRow}>
      <View style={styles.slBadge}>
        <Text style={styles.slBadgeText}>{letter}</Text>
      </View>
      <Text style={styles.slText}>{children}</Text>
    </View>
  );
}

/* ─── Damage record card ───────────────────────────────────────────── */
function DamageCard({
  dmg,
  onUpdate,
  onDelete,
  onCapture,
}: {
  dmg: DamageRecord;
  onUpdate: (id: number, u: Partial<DamageRecord>) => void;
  onDelete: (id: number) => void;
  onCapture: (id: number, kind: 'camera' | 'library') => void;
}) {
  return (
    <View style={styles.damageCard}>
      <View style={styles.damageHeader}>
        <Text style={styles.damageTitle}>Damage / Crack Record</Text>
        <Pressable onPress={() => onDelete(dmg.id)} hitSlop={8} accessibilityLabel="Delete damage record">
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
        </Pressable>
      </View>

      <MiniLabel>Damage Type</MiniLabel>
      <PillSelect options={DAMAGE_TYPES} value={dmg.damageType} onChange={(v) => onUpdate(dmg.id, { damageType: v })} />

      <View style={styles.mt}>
        <MiniLabel>Damage Location</MiniLabel>
        <FieldInput placeholder="Describe the damage location..." value={dmg.location} onChangeText={(v) => onUpdate(dmg.id, { location: v })} />
      </View>

      <View style={styles.mt}>
        <MiniLabel>Direction</MiniLabel>
        <PillSelect options={DIRECTIONS} value={dmg.direction} onChange={(v) => onUpdate(dmg.id, { direction: v })} />
      </View>

      <View style={[styles.row, styles.mt]}>
        <View style={styles.flex1}>
          <MiniLabel>Width (mm)</MiniLabel>
          <FieldInput placeholder="mm" keyboardType="numeric" value={dmg.width} onChangeText={(v) => onUpdate(dmg.id, { width: v })} />
        </View>
        <View style={styles.flex1}>
          <MiniLabel>Length (mm)</MiniLabel>
          <FieldInput placeholder="mm" keyboardType="numeric" value={dmg.length} onChangeText={(v) => onUpdate(dmg.id, { length: v })} />
        </View>
      </View>

      <View style={styles.mt}>
        <MiniLabel>Inspector Notes</MiniLabel>
        <FieldInput
          style={styles.textareaSm}
          placeholder="Notes about this damage..."
          value={dmg.notes}
          onChangeText={(v) => onUpdate(dmg.id, { notes: v })}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.mt}>
        <PhotoStrip photos={dmg.photos} onCapture={(k) => onCapture(dmg.id, k)} />
      </View>
    </View>
  );
}

/* ─── Screen ───────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

export function GarageCarportScreen({ onBack, onComplete, onGoHome }: Props) {
  const [items, setItems] = useState<GarageItem[]>([makeGarage(1, 'Garage 1')]);
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
          let s = `${it.name}${it.position ? ` (${it.position})` : ''}: ${
            it.attachment === 'attached' ? 'attached to house' : it.attachment === 'separate' ? 'separate structure' : 'structure'
          }`;
          if (it.wallConstruction.length) s += `, ${it.wallConstruction.join('/').toLowerCase()} walls`;
          if (it.condition) s += `, in ${(CONDITION_LABEL[it.condition] || it.condition).toLowerCase()} condition`;
          s += '.';
          if (it.notes) s += ` ${it.notes}`;
          return s;
        })
        .join(' ') ||
      (items.some((it) => it.available === 'no') ? 'No garage / carport present.' : 'Garage / carport not recorded.');
    const damages = items.flatMap((it) =>
      it.hasDamage === 'yes'
        ? it.damages.map((d) => ({
            type: d.damageType || 'Damage',
            location: d.location,
            direction: d.direction,
            widthMm: parseFloat(d.width) || 0,
            lengthMm: parseFloat(d.length) || 0,
            notes: d.notes,
            photos: d.photos.map((p) => p.uri),
          }))
        : [],
    );
    const photos = items.flatMap((it) => it.photos.map((p) => p.uri));
    draft.setSection({
      key: 'garage_carport_sheds',
      name: 'Garage / Carport / Sheds',
      icon: '🏚️',
      order: 7,
      status: 'complete',
      reportText,
      fields: { structures: String(items.length) },
      photos,
      damages,
    });
  };

  const upd = (updates: Partial<GarageItem>) =>
    setItems((prev) =>
      prev.map((it, i) =>
        i === currentIdx ? { ...it, ...updates, status: it.status === 'pending' ? 'in-progress' : it.status } : it,
      ),
    );

  const toggleArr = (field: keyof GarageItem, val: string) => {
    const cur = item[field] as string[];
    upd({ [field]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const addDamage = () =>
    upd({
      damages: [
        ...item.damages,
        { id: nextDamageId++, damageType: '', location: '', direction: '', width: '', length: '', notes: '', photos: [] },
      ],
    });
  const updateDamage = (id: number, u: Partial<DamageRecord>) =>
    upd({ damages: item.damages.map((d) => (d.id === id ? { ...d, ...u } : d)) });
  const deleteDamage = (id: number) => upd({ damages: item.damages.filter((d) => d.id !== id) });

  async function captureDamagePhoto(id: number, kind: 'camera' | 'library') {
    const photo = kind === 'camera'
      ? await takePhoto({ sectionKey: 'garage_carport_sheds', category: 'damage' })
      : await pickFromLibrary({ sectionKey: 'garage_carport_sheds', category: 'damage' });
    if (!photo) return;
    const target = item.damages.find((d) => d.id === id);
    if (target) updateDamage(id, { photos: [...target.photos, photo] });
  }

  async function captureItemPhoto(kind: 'camera' | 'library') {
    const opts = { sectionKey: 'garage_carport_sheds', sortOrder: item.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) upd({ photos: [...item.photos, photo] });
  }

  function addGarage() {
    const n = items.length + 1;
    setItems((prev) => [...prev, makeGarage(n, `Garage ${n}`)]);
    setCurrentIdx(items.length);
  }

  function completeItem() {
    setItems((prev) => prev.map((it, i) => (i === currentIdx ? { ...it, status: 'complete' } : it)));
    const next = items.findIndex((it, i) => i !== currentIdx && it.status !== 'complete');
    if (next >= 0) {
      setCurrentIdx(next);
      show(`${item.name} complete`);
    } else {
      show('All structures complete!');
      saveToDraft();
      setTimeout(onComplete, 700);
    }
  }

  const completedCount = items.filter((it) => it.status === 'complete').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SectionGradientHeader
        eyebrow="GARAGE / CARPORT / SHED"
        title={item.name}
        status={item.status}
        conditionLabel={item.condition ? CONDITION_LABEL[item.condition] : undefined}
        conditionColor={item.condition ? CONDITION_COLOR[item.condition] : undefined}
        pager={{
          index: currentIdx,
          total: items.length,
          unit: 'structures',
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
          <Pressable onPress={addGarage} style={styles.addChip}>
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
          <Text style={styles.availQ}>Garage / Carport Available?</Text>
          <YesNoToggle value={item.available || null} onChange={(v) => upd({ available: v })} />
        </Card>

        {item.available === 'no' && (
          <View style={styles.notPresent}>
            <Ionicons name="car-outline" size={22} color={colors.textMuted} />
            <View style={styles.flex1}>
              <Text style={styles.notPresentTitle}>No Garage / Carport Present</Text>
              <Text style={styles.notPresentText}>This structure will be marked as not applicable.</Text>
            </View>
          </View>
        )}

        {item.available === 'yes' && (
          <>
            {/* A. Structure Information */}
            <Card>
              <SL letter="A">STRUCTURE INFORMATION</SL>
              <MiniLabel>Structure Attachment</MiniLabel>
              <PillSelect
                options={['Attached to House', 'Separate Structure']}
                value={item.attachment === 'attached' ? 'Attached to House' : item.attachment === 'separate' ? 'Separate Structure' : ''}
                onChange={(v) => upd({ attachment: v === 'Attached to House' ? 'attached' : 'separate' })}
              />
              <View style={styles.mt}>
                <MiniLabel>Structure Position</MiniLabel>
                <PillSelect options={POSITIONS} value={item.position} onChange={(v) => upd({ position: v })} />
              </View>
              <View style={styles.mt}>
                <MiniLabel>Basement Present</MiniLabel>
                <YesNoToggle value={item.basementPresent || null} onChange={(v) => upd({ basementPresent: v })} />
              </View>
            </Card>

            {/* B. Wall Construction */}
            <Card>
              <SL letter="B">WALL CONSTRUCTION</SL>
              <ChipMultiSelect options={WALL_OPTS} selected={item.wallConstruction} onToggle={(v) => toggleArr('wallConstruction', v)} />
            </Card>

            {/* C. Roof Construction */}
            <Card>
              <SL letter="C">ROOF CONSTRUCTION</SL>
              <ChipMultiSelect options={ROOF_OPTS} selected={item.roofConstruction} onToggle={(v) => toggleArr('roofConstruction', v)} />
            </Card>

            {/* D. Floor Type */}
            <Card>
              <SL letter="D">FLOOR TYPE</SL>
              <ChipMultiSelect options={FLOOR_OPTS} selected={item.floorType} onToggle={(v) => toggleArr('floorType', v)} />
            </Card>

            {/* E. General Condition */}
            <Card>
              <SL letter="E">GENERAL CONDITION</SL>
              <ColorOptionList options={CONDITIONS} value={item.condition} onChange={(v) => upd({ condition: v })} />
            </Card>

            {/* F. Visibility / Access Obstruction */}
            <Card>
              <SL letter="F">VISIBILITY / ACCESS OBSTRUCTION</SL>
              <ChipMultiSelect options={OBSTRUCTION_OPTS} selected={item.obstructions} onToggle={(v) => toggleArr('obstructions', v)} />
            </Card>

            {/* G. Damage / Crack Records — gated behind a Yes/No */}
            <Card>
              <SL letter="G">DAMAGE / CRACK RECORDS</SL>
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
                    <DamageCard key={d.id} dmg={d} onUpdate={updateDamage} onDelete={deleteDamage} onCapture={captureDamagePhoto} />
                  ))}
                  {item.damages.length === 0 && (
                    <Text style={styles.emptyText}>No records yet — tap “Add Damage / Crack”.</Text>
                  )}
                </View>
              )}
            </Card>

            {/* H–K. Observation groups */}
            <Card>
              <SL letter="H">CLADDING OBSERVATIONS</SL>
              <ChipMultiSelect options={CLADDING_OPTS} selected={item.claddingObs} onToggle={(v) => toggleArr('claddingObs', v)} />
            </Card>
            <Card>
              <SL letter="I">WINDOWS / DOORS OBSERVATIONS</SL>
              <ChipMultiSelect options={WINDOWS_OPTS} selected={item.windowsDoorObs} onToggle={(v) => toggleArr('windowsDoorObs', v)} />
            </Card>
            <Card>
              <SL letter="J">EAVES OBSERVATIONS</SL>
              <ChipMultiSelect options={EAVES_OPTS} selected={item.eavesObs} onToggle={(v) => toggleArr('eavesObs', v)} />
            </Card>
            <Card>
              <SL letter="K">DOWNPIPES / GUTTERS</SL>
              <ChipMultiSelect options={DOWNPIPES_OPTS} selected={item.downpipesObs} onToggle={(v) => toggleArr('downpipesObs', v)} />
            </Card>

            {/* L. Inspector Notes */}
            <Card>
              <SL letter="L">INSPECTOR NOTES</SL>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Free text notes about this structure..."
                placeholderTextColor={colors.textMuted}
                value={item.notes}
                onChangeText={(v) => upd({ notes: v.slice(0, 500) })}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{item.notes.length}/500</Text>
            </Card>

            {/* M. Additional Photographs */}
            <Card>
              <SL letter="M">ADDITIONAL PHOTOGRAPHS</SL>
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
          <Button label="Add" variant="outline" leftIcon="add" fitContent onPress={addGarage} />
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

  /* Strip */
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
  availQ: { ...typography.bodySm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  mt: { marginTop: spacing.sm },

  /* Letter section label */
  slRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  slBadge: { width: 20, height: 20, borderRadius: radius.sm, backgroundColor: colors.headerGradientFrom, alignItems: 'center', justifyContent: 'center' },
  slBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
  slText: { ...typography.sectionTitle, color: colors.textSecondary, textTransform: 'uppercase' },

  /* Inputs */
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
  textareaSm: { minHeight: 56 },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },

  /* Gated damage section */
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

  /* Damage card */
  damageCard: { borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF7F7', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  damageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  damageTitle: { ...typography.caption, fontWeight: '700', color: colors.danger },

  /* Not present */
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

  /* Footer */
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.success },
  progressText: { ...typography.caption, color: colors.textMuted },
});
