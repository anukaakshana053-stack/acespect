import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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
  PhotoStrip,
  PillSelect,
  SectionLabel,
  Toast,
  YesNoToggle,
  makeDamageRecord,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
interface RoomInstance {
  id: number;
  available: 'yes' | 'no' | null;
  floorLevel: string;
  obstruction: string[];
  generalCondition: string;
  generalDamageCondition: string;
  hasDamage: 'yes' | 'no' | null;
  damages: DamageRecord[];
  moistureObservations: string[];
  notes: string;
  photos: CapturedPhoto[];
  saved: boolean;
}

interface RoomType {
  id: string;
  label: string;
  instances: RoomInstance[];
}

/* ─── Option data ──────────────────────────────────────────────────── */
const ROOM_TYPE_LABELS = [
  'Front Entry & Hallway', 'Living Room', 'Dining Area', 'Kitchen', 'Bedroom',
  'Bathroom', 'Laundry', 'Toilet', 'Stairwell', 'Other Internal Area',
];
const FLOOR_LEVELS = ['Ground Floor', '1st Floor', '2nd Floor', 'Other'];
const OBSTRUCTION_OPTIONS = ['Furniture', 'Stored Goods', 'Limited Access', 'Other'];
const GENERAL_CONDITION: ColorOption[] = [
  { value: 'Satisfactory and in Typical Condition', label: 'Satisfactory — Typical Condition', color: '#16A34A' },
  { value: 'Fair', label: 'Fair', color: '#CA8A04' },
  { value: 'Poor', label: 'Poor', color: '#DC2626' },
  { value: 'New', label: 'New', color: '#2563EB' },
  { value: 'Other', label: 'Other', color: '#64748B' },
];
const GENERAL_DAMAGE_OPTIONS = [
  'No Visible Significant Damage', 'Several Minor Gaps and Cracks',
  'Multiple Items of Damage Throughout', 'Localised Damage Observed',
];
const MOISTURE_OPTIONS = ['Water Staining', 'Dark Mould', 'Moisture Signs', 'No Issues Observed'];
const DAMAGE_TYPES = ['Crack', 'Subsidence', 'Gap', 'Hole', 'Chipping', 'Surface Damage', 'Tile Damage', 'Movement', 'Rust', 'Other'];

let nextInstanceId = 1;
let nextDamageId = 1;

function makeInstance(): RoomInstance {
  return {
    id: nextInstanceId++,
    available: null,
    floorLevel: '',
    obstruction: [],
    generalCondition: '',
    generalDamageCondition: '',
    hasDamage: null,
    damages: [],
    moistureObservations: [],
    notes: '',
    photos: [],
    saved: false,
  };
}

function initialRoomTypes(): RoomType[] {
  return ROOM_TYPE_LABELS.map((label) => ({ id: label, label, instances: [makeInstance()] }));
}

/* ─── Screen ───────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

export function InternalAreasScreen({ onBack, onComplete, onGoHome }: Props) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [selectedTypeIdx, setSelectedTypeIdx] = useState<number | null>(null);
  const [instanceIdx, setInstanceIdx] = useState(0);
  const draft = useInspectionDraft();

  const handleComplete = () => {
    const damages = roomTypes.flatMap((rt) =>
      rt.instances.flatMap((inst) =>
        inst.damages.map((d) => ({
          type: d.damageType || 'Damage',
          location: [rt.label, d.location].filter(Boolean).join(' — '),
          direction: d.direction,
          widthMm: parseFloat(d.widthMm) || 0,
          lengthMm: parseFloat(d.lengthMm) || 0,
          notes: d.notes,
          photos: d.photos.map((p) => p.uri),
        })),
      ),
    );
    const lines = roomTypes.flatMap((rt) =>
      rt.instances
        .filter((inst) => inst.saved || inst.generalCondition || inst.damages.length > 0)
        .map((inst) => {
          const cond = inst.generalCondition || 'inspected';
          const floor = inst.floorLevel ? ` (${inst.floorLevel})` : '';
          return `${rt.label}${floor}: ${cond}.${inst.notes ? ' ' + inst.notes : ''}`;
        }),
    );
    draft.setSection({
      key: 'internal_areas',
      name: 'Internal Areas',
      icon: '🛋️',
      order: 4,
      status: 'complete',
      reportText: lines.join(' ') || 'Internal areas inspected throughout.',
      fields: {
        roomsRecorded: String(roomTypes.filter((rt) => rt.instances.some((i) => i.saved)).length),
      },
      damages,
    });
    onComplete();
  };
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();

  const currentType = selectedTypeIdx !== null ? roomTypes[selectedTypeIdx] : null;
  const instance = currentType ? currentType.instances[instanceIdx] : null;

  const openRoom = (idx: number) => { setSelectedTypeIdx(idx); setInstanceIdx(0); };
  const closeRoom = () => setSelectedTypeIdx(null);

  const updateInstance = (patch: Partial<RoomInstance>) => {
    if (selectedTypeIdx === null) return;
    setRoomTypes((prev) =>
      prev.map((rt, ti) =>
        ti !== selectedTypeIdx
          ? rt
          : { ...rt, instances: rt.instances.map((inst, ii) => (ii !== instanceIdx ? inst : { ...inst, ...patch })) },
      ),
    );
  };

  const toggleArr = (field: 'obstruction' | 'moistureObservations', val: string) => {
    if (!instance) return;
    const cur = instance[field];
    updateInstance({ [field]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const addDamage = () => instance && updateInstance({ damages: [...instance.damages, makeDamageRecord(nextDamageId++)] });
  const updateDamage = (id: number, u: Partial<DamageRecord>) =>
    instance && updateInstance({ damages: instance.damages.map((d) => (d.id === id ? { ...d, ...u } : d)) });
  const deleteDamage = (id: number) => instance && updateInstance({ damages: instance.damages.filter((d) => d.id !== id) });

  async function captureDamagePhoto(id: number, kind: 'camera' | 'library') {
    if (!instance) return;
    const opts = { sectionKey: 'internal_areas', category: currentType?.label };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (!photo) return;
    const target = instance.damages.find((d) => d.id === id);
    if (target) updateDamage(id, { photos: [...target.photos, photo] });
  }

  async function captureInstancePhoto(kind: 'camera' | 'library') {
    if (!instance) return;
    const opts = { sectionKey: 'internal_areas', category: currentType?.label, sortOrder: instance.photos.length };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (photo) updateInstance({ photos: [...instance.photos, photo] });
  }

  const saveInstance = () => {
    updateInstance({ saved: true });
    show('Internal area saved');
  };

  const addAnotherInstance = () => {
    if (selectedTypeIdx === null || !currentType) return;
    setRoomTypes((prev) => prev.map((rt, ti) => (ti !== selectedTypeIdx ? rt : { ...rt, instances: [...rt.instances, makeInstance()] })));
    setInstanceIdx(currentType.instances.length);
  };

  const savedRoomTypes = roomTypes.filter((rt) => rt.instances.some((i) => i.saved)).length;
  const pct = Math.round((savedRoomTypes / roomTypes.length) * 100);

  /* ── INDEX VIEW ──────────────────────────────────────────────── */
  if (selectedTypeIdx === null || !currentType || !instance) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={[colors.headerGradientFrom, colors.headerGradientTo]} style={styles.idxHeader}>
          <SafeAreaView edges={['top']}>
            <View style={styles.idxHeaderRow}>
              <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Back">
                <Ionicons name="arrow-back" size={18} color={colors.white} />
              </Pressable>
              <Text style={styles.idxTitle}>Internal Areas</Text>
              <Pressable onPress={onGoHome} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Home">
                <Ionicons name="home-outline" size={16} color={colors.white} />
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Room Progress</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressMeta}>{savedRoomTypes} of {roomTypes.length} room types recorded</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.idxListContent} showsVerticalScrollIndicator={false}>
          {roomTypes.map((rt, idx) => {
            const saved = rt.instances.filter((i) => i.saved).length;
            const complete = saved > 0;
            return (
              <Pressable
                key={rt.id}
                onPress={() => openRoom(idx)}
                style={({ pressed }) => [styles.roomRow, pressed && styles.roomRowPressed]}
              >
                <View style={[styles.numBadge, complete && styles.numBadgeDone]}>
                  {complete ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <Text style={styles.numBadgeText}>{idx + 1}</Text>
                  )}
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.roomLabel, complete && styles.roomLabelDone]}>{idx + 1}. {rt.label}</Text>
                  {rt.instances.length > 1 && <Text style={styles.roomSub}>{rt.instances.length} instances</Text>}
                </View>
                {saved > 0 ? (
                  <View style={[styles.statusPill, complete && saved === rt.instances.length ? styles.pillDone : styles.pillPartial]}>
                    <Text style={[styles.pillText, complete && saved === rt.instances.length ? styles.pillTextDone : styles.pillTextPartial]}>
                      {saved === rt.instances.length ? 'Complete' : `${saved}/${rt.instances.length} saved`}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, styles.pillPending]}>
                    <Text style={[styles.pillText, styles.pillTextPending]}>Pending</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Button label="Complete Internal Areas" variant="primaryGradient" leftIcon="checkmark" onPress={handleComplete} />
        </SafeAreaView>

        <Toast message={toast} />
      </View>
    );
  }

  /* ── DETAIL VIEW ─────────────────────────────────────────────── */
  const isLastRoom = selectedTypeIdx >= roomTypes.length - 1;
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.headerGradientFrom, colors.headerGradientTo]} style={styles.idxHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.idxHeaderRow}>
            <Pressable onPress={closeRoom} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Back to room list">
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </Pressable>
            <View style={styles.detailTitleWrap}>
              <Text style={styles.detailEyebrow}>ROOM {selectedTypeIdx + 1} OF {roomTypes.length}</Text>
              <Text style={styles.idxTitle} numberOfLines={1}>{currentType.label}</Text>
            </View>
            <Pressable onPress={onGoHome} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Home">
              <Ionicons name="home-outline" size={16} color={colors.white} />
            </Pressable>
          </View>

          {currentType.instances.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instTabs}>
              {currentType.instances.map((inst, i) => {
                const active = i === instanceIdx;
                return (
                  <Pressable key={inst.id} onPress={() => setInstanceIdx(i)} style={[styles.instTab, active && styles.instTabActive]}>
                    <Text style={[styles.instTabText, active && styles.instTabTextActive]}>#{i + 1}</Text>
                    {inst.saved && <View style={styles.instSavedDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available */}
        <Card>
          <SectionLabel>{currentType.label}{instanceIdx > 0 ? ` #${instanceIdx + 1}` : ''} — Available</SectionLabel>
          <YesNoToggle value={instance.available} onChange={(v) => updateInstance({ available: v })} />
        </Card>

        {instance.available === 'no' && (
          <View style={styles.notPresent}>
            <Ionicons name="bed-outline" size={22} color={colors.textMuted} />
            <View style={styles.flex1}>
              <Text style={styles.notPresentTitle}>Not Present</Text>
              <Text style={styles.notPresentText}>No inspection required for this area.</Text>
            </View>
          </View>
        )}

        {instance.available === 'yes' && (
          <>
            <Card>
              <SectionLabel>A. Floor Level</SectionLabel>
              <PillSelect options={FLOOR_LEVELS} value={instance.floorLevel} onChange={(v) => updateInstance({ floorLevel: v })} />
            </Card>

            <Card>
              <SectionLabel>B. Visibility / Access Obstruction</SectionLabel>
              <ChipMultiSelect options={OBSTRUCTION_OPTIONS} selected={instance.obstruction} onToggle={(v) => toggleArr('obstruction', v)} />
            </Card>

            <Card>
              <SectionLabel>C. General Condition</SectionLabel>
              <ColorOptionList options={GENERAL_CONDITION} value={instance.generalCondition} onChange={(v) => updateInstance({ generalCondition: v })} />
            </Card>

            <Card>
              <SectionLabel>D. General Damage Condition</SectionLabel>
              <PillSelect options={GENERAL_DAMAGE_OPTIONS} value={instance.generalDamageCondition} onChange={(v) => updateInstance({ generalDamageCondition: v })} />
            </Card>

            {/* E. Damage / Crack Records — gated behind Yes/No */}
            <Card>
              <SectionLabel>E. Damage / Crack Records</SectionLabel>
              <Text style={styles.helper}>Is there any notable damage or cracking?</Text>
              <YesNoToggle value={instance.hasDamage} onChange={(v) => updateInstance({ hasDamage: v })} />

              {instance.hasDamage === 'yes' && (
                <View style={styles.gateSection}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.recordsLabel}>
                      {instance.damages.length} record{instance.damages.length !== 1 ? 's' : ''}
                    </Text>
                    <Pressable onPress={addDamage} style={styles.addDamageBtn}>
                      <Ionicons name="add" size={13} color={colors.danger} />
                      <Text style={styles.addDamageText}>Add Damage / Crack</Text>
                    </Pressable>
                  </View>
                  {instance.damages.map((d) => (
                    <DamageRecordCard
                      key={d.id}
                      record={d}
                      damageTypes={DAMAGE_TYPES}
                      onUpdate={updateDamage}
                      onDelete={deleteDamage}
                      onCapture={captureDamagePhoto}
                    />
                  ))}
                  {instance.damages.length === 0 && (
                    <Text style={styles.emptyText}>No records yet — tap “Add Damage / Crack”.</Text>
                  )}
                </View>
              )}
            </Card>

            <Card>
              <SectionLabel>F. Moisture / Water Observations</SectionLabel>
              <ChipMultiSelect options={MOISTURE_OPTIONS} selected={instance.moistureObservations} onToggle={(v) => toggleArr('moistureObservations', v)} />
            </Card>

            <Card>
              <SectionLabel>G. Inspector Notes</SectionLabel>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Enter your observations and notes here..."
                placeholderTextColor={colors.textMuted}
                value={instance.notes}
                onChangeText={(v) => updateInstance({ notes: v.slice(0, 500) })}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{instance.notes.length}/500</Text>
            </Card>

            <Card>
              <SectionLabel>H. Additional Photographs</SectionLabel>
              <Text style={styles.helper}>{instance.photos.length} linked to this area</Text>
              <PhotoStrip photos={instance.photos} onCapture={captureInstancePhoto} />
            </Card>
          </>
        )}

        {/* I. Save */}
        {instance.available !== null && (
          <Card>
            <Button
              label={instance.saved ? 'Saved ✓' : `Save ${currentType.label}`}
              variant={instance.saved ? 'successGradient' : 'primaryGradient'}
              leftIcon="checkmark"
              onPress={saveInstance}
            />
          </Card>
        )}

        {/* J. Add another instance (after save) */}
        {instance.saved && (
          <Pressable onPress={addAnotherInstance} style={styles.addAnother}>
            <Ionicons name="add" size={15} color={colors.barBlue} />
            <Text style={styles.addAnotherText}>Add another {currentType.label}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Footer: list + next room */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.row}>
          <Button label="Room List" variant="outline" leftIcon="list-outline" fitContent onPress={closeRoom} />
          <Button
            label={isLastRoom ? 'Back to List' : `Next: ${roomTypes[selectedTypeIdx + 1].label}`}
            variant="primaryGradient"
            rightIcon="chevron-forward"
            style={styles.nextBtn}
            onPress={() => (isLastRoom ? closeRoom() : openRoom(selectedTypeIdx + 1))}
          />
        </View>
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Headers */
  idxHeader: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  idxHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  idxTitle: { ...typography.h3, color: colors.white, fontSize: 16, flex: 1, textAlign: 'center' },
  detailTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  detailEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' },

  /* Instance tabs */
  instTabs: { gap: spacing.xs, paddingTop: spacing.sm },
  instTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  instTabActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' },
  instTabText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  instTabTextActive: { color: colors.white },
  instSavedDot: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },

  /* Progress (index) */
  progressCard: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { ...typography.bodySm, fontWeight: '700', color: colors.textPrimary },
  progressPct: { ...typography.bodySm, fontWeight: '700', color: colors.textPrimary },
  track: { height: 6, backgroundColor: colors.progressTrack, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.progressFill, borderRadius: radius.pill },
  progressMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },

  /* Index list */
  body: { flex: 1 },
  idxListContent: { paddingBottom: spacing.xxxl },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  roomRowPressed: { backgroundColor: colors.surfaceAlt },
  numBadge: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  numBadgeDone: { backgroundColor: colors.success, borderColor: colors.success },
  numBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  roomLabel: { ...typography.bodySm, fontWeight: '600', color: colors.textPrimary },
  roomLabelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  roomSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  pillDone: { backgroundColor: colors.accentGreen },
  pillPartial: { backgroundColor: colors.accentBlue },
  pillPending: { backgroundColor: colors.surfaceAlt },
  pillText: { fontSize: 10, fontWeight: '700' },
  pillTextDone: { color: colors.barGreen },
  pillTextPartial: { color: colors.barBlue },
  pillTextPending: { color: colors.textMuted },

  /* Detail body */
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  nextBtn: { flex: 1 },

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

  addAnother: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.barBlue,
    marginBottom: spacing.lg,
  },
  addAnotherText: { ...typography.bodySm, fontWeight: '700', color: colors.barBlue },

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
});
