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
  DamageRecord,
  DamageRecordCard,
  FieldInput,
  PillSelect,
  SectionLabel,
  Toast,
  YesNoToggle,
  makeDamageRecord,
  useToast,
} from '../../components/inspection/sectionKit';

/* ─── Types ────────────────────────────────────────────────────────── */
type YesNo = 'yes' | 'no' | null;

interface MovementItem {
  key: string;
  label: string;
  value: YesNo;
  note: string;
}

interface NoAccessItem {
  id: number;
  area: string;
  reason: string;
}

const MOVEMENT_LABELS: { key: string; label: string }[] = [
  { key: 'bouncyFloors', label: 'Bouncy / Squeaking Floors' },
  { key: 'slopingFloors', label: 'Floors Out of Level / Subsidence' },
  { key: 'bindingDoors', label: 'Doors Binding' },
  { key: 'looseBricks', label: 'Loose Bricks Safety Concern' },
  { key: 'leaningFences', label: 'Leaning Fences Safety Concern' },
  { key: 'balconyCondition', label: 'Balcony Poor Condition' },
];

const DAMAGE_TYPES = ['Crack', 'Subsidence', 'Gap', 'Hole', 'Chipping', 'Surface Damage', 'Tile Damage', 'Movement', 'Rust', 'Other'];

let nextNoAccessId = 1;
let nextDamageId = 1;

/* ─── Screen ───────────────────────────────────────────────────────── */
interface Props {
  onBack: () => void;
  onComplete: () => void;
  onGoHome: () => void;
}

export function NotesPostProjectScreen({ onBack, onComplete, onGoHome }: Props) {
  const { toast, show } = useToast();
  const { takePhoto, pickFromLibrary } = usePhotoCapture();
  const draft = useInspectionDraft();

  const [movement, setMovement] = useState<MovementItem[]>(
    MOVEMENT_LABELS.map((m) => ({ ...m, value: null, note: '' })),
  );
  const [noAccess, setNoAccess] = useState<NoAccessItem[]>([]);
  const [postProject, setPostProject] = useState<YesNo>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [hasDamage, setHasDamage] = useState<YesNo>(null);
  const [damages, setDamages] = useState<DamageRecord[]>([]);

  const setMov = (key: string, patch: Partial<MovementItem>) =>
    setMovement((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const addNoAccess = () => setNoAccess((prev) => [...prev, { id: nextNoAccessId++, area: '', reason: '' }]);
  const updateNoAccess = (id: number, patch: Partial<NoAccessItem>) =>
    setNoAccess((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const deleteNoAccess = (id: number) => setNoAccess((prev) => prev.filter((i) => i.id !== id));

  const addDamage = () => setDamages((prev) => [...prev, makeDamageRecord(nextDamageId++)]);
  const updateDamage = (id: number, u: Partial<DamageRecord>) =>
    setDamages((prev) => prev.map((d) => (d.id === id ? { ...d, ...u } : d)));
  const deleteDamage = (id: number) => setDamages((prev) => prev.filter((d) => d.id !== id));

  async function captureDamagePhoto(id: number, kind: 'camera' | 'library') {
    const opts = { sectionKey: 'notes_defects', category: 'defect' };
    const photo = kind === 'camera' ? await takePhoto(opts) : await pickFromLibrary(opts);
    if (!photo) return;
    setDamages((prev) => prev.map((d) => (d.id === id ? { ...d, photos: [...d.photos, photo] } : d)));
  }

  const safetyCount = movement.filter((m) => m.value === 'yes').length;

  const handleComplete = () => {
    const movementNotes = movement
      .filter((m) => m.value === 'yes')
      .map((m) => `${m.label}${m.note ? `: ${m.note}` : ''}.`);
    const noAccessNotes = noAccess
      .filter((a) => a.area)
      .map((a) => `No access to ${a.area}${a.reason ? ` (${a.reason})` : ''}.`);
    const reportText =
      [additionalNotes.trim(), ...movementNotes, ...noAccessNotes].filter(Boolean).join(' ') ||
      'No additional notes recorded.';

    draft.setSection({
      key: 'notes',
      name: 'Notes & Post Project',
      icon: '📝',
      order: 5,
      status: 'complete',
      reportText,
      fields: {
        postProject: postProject === 'yes' ? 'Yes' : postProject === 'no' ? 'No' : '',
        safetyIssues: String(safetyCount),
      },
      damages:
        hasDamage === 'yes'
          ? damages.map((d) => ({
              type: d.damageType || 'Damage',
              location: d.location,
              direction: d.direction,
              widthMm: parseFloat(d.widthMm) || 0,
              lengthMm: parseFloat(d.lengthMm) || 0,
              notes: d.notes,
              photos: d.photos.map((p) => p.uri),
            }))
          : [],
    });
    onComplete();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient colors={[colors.headerGradientFrom, colors.headerGradientTo]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>NOTES & POST PROJECT</Text>
              <Text style={styles.title}>Notes / Defects</Text>
            </View>
            <Pressable onPress={onGoHome} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Home">
              <Ionicons name="home-outline" size={16} color={colors.white} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Safety banner */}
      {safetyCount > 0 && (
        <View style={styles.safetyBar}>
          <Ionicons name="warning-outline" size={14} color={colors.danger} />
          <Text style={styles.safetyText}>
            {safetyCount} safety / movement issue{safetyCount > 1 ? 's' : ''} noted
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* A. Movement / Safety Notes */}
        <Card>
          <SectionLabel>A. Movement / Safety Notes</SectionLabel>
          {movement.map((m, i) => (
            <View key={m.key} style={[styles.movItem, i > 0 && styles.movItemBorder]}>
              <View style={styles.movHeader}>
                <Text style={styles.movLabel}>{m.label}</Text>
                {m.value === 'yes' && (
                  <View style={styles.notedBadge}>
                    <Text style={styles.notedText}>NOTED</Text>
                  </View>
                )}
              </View>
              <YesNoToggle value={m.value} onChange={(v) => setMov(m.key, { value: v })} />
              {m.value === 'yes' && (
                <FieldInput
                  style={[styles.mt, styles.dangerInput]}
                  placeholder="Describe location and details..."
                  value={m.note}
                  onChangeText={(v) => setMov(m.key, { note: v })}
                />
              )}
            </View>
          ))}
        </Card>

        {/* B. No Access Areas */}
        <Card>
          <SectionLabel>B. No Access Areas</SectionLabel>
          {noAccess.map((it) => (
            <View key={it.id} style={styles.noAccessCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.noAccessTitle}>NO ACCESS RECORD</Text>
                <Pressable onPress={() => deleteNoAccess(it.id)} hitSlop={8} accessibilityLabel="Delete record">
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                </Pressable>
              </View>
              <Text style={styles.miniLabel}>Area / Location</Text>
              <FieldInput placeholder="e.g. Roof space, rear shed..." value={it.area} onChangeText={(v) => updateNoAccess(it.id, { area: v })} />
              <Text style={[styles.miniLabel, styles.mt]}>Reason for No Access</Text>
              <FieldInput placeholder="e.g. Locked, hazardous, not applicable..." value={it.reason} onChangeText={(v) => updateNoAccess(it.id, { reason: v })} />
            </View>
          ))}
          <Pressable onPress={addNoAccess} style={styles.dashedBtn}>
            <Ionicons name="add" size={15} color={colors.textSecondary} />
            <Text style={styles.dashedBtnText}>Add No Access Area</Text>
          </Pressable>
        </Card>

        {/* C. Post Project Updates */}
        <Card>
          <SectionLabel>C. Post Project Updates</SectionLabel>
          <Text style={styles.helper}>Is this a post-project re-inspection of a previous dilapidation report?</Text>
          <PillSelect
            options={['Yes — Post Project', 'No — Pre Project']}
            value={postProject === 'yes' ? 'Yes — Post Project' : postProject === 'no' ? 'No — Pre Project' : ''}
            onChange={(v) => setPostProject(v === 'Yes — Post Project' ? 'yes' : 'no')}
          />
          {postProject === 'yes' && (
            <View style={styles.warnCard}>
              <Ionicons name="warning-outline" size={14} color={colors.accentOrangeFg} />
              <View style={styles.flex1}>
                <Text style={styles.warnTitle}>Post Project Protocol</Text>
                <Text style={styles.warnText}>
                  Use the previous report and update every item with a new Yes/No status and current photos, comparing against the original pre-works baseline.
                </Text>
              </View>
            </View>
          )}
          {postProject === 'no' && (
            <View style={styles.okCard}>
              <Ionicons name="checkmark-circle" size={14} color={colors.barGreen} />
              <Text style={styles.okText}>Pre-project — proceed with fresh baseline inspection.</Text>
            </View>
          )}
        </Card>

        {/* D. Additional Notes */}
        <Card>
          <SectionLabel>D. Additional Notes</SectionLabel>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={14} color={colors.infoFg} />
            <Text style={styles.infoText}>
              Record final notes, previous defects not covered elsewhere, and any items that may be affected by nearby works.
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter final notes, safety concerns, limitations, or items affected by nearby construction works..."
            placeholderTextColor={colors.textMuted}
            value={additionalNotes}
            onChangeText={(v) => setAdditionalNotes(v.slice(0, 1000))}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{additionalNotes.length}/1000</Text>
        </Card>

        {/* E. Record Condition / Damage — gated behind Yes/No */}
        <Card>
          <SectionLabel>E. Record Condition / Damage</SectionLabel>
          <Text style={styles.helper}>Any condition or damage to record here?</Text>
          <YesNoToggle value={hasDamage} onChange={setHasDamage} />

          {hasDamage === 'yes' && (
            <View style={styles.gateSection}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.recordsLabel}>
                  {damages.length} record{damages.length !== 1 ? 's' : ''}
                </Text>
                <Pressable onPress={addDamage} style={styles.addDamageBtn}>
                  <Ionicons name="add" size={13} color={colors.danger} />
                  <Text style={styles.addDamageText}>Add Damage / Crack</Text>
                </Pressable>
              </View>
              {damages.map((d) => (
                <DamageRecordCard
                  key={d.id}
                  record={d}
                  damageTypes={DAMAGE_TYPES}
                  onUpdate={updateDamage}
                  onDelete={deleteDamage}
                  onCapture={captureDamagePhoto}
                />
              ))}
              {damages.length === 0 && <Text style={styles.emptyText}>No records yet — tap “Add Damage / Crack”.</Text>}
            </View>
          )}
        </Card>

        {safetyCount > 0 && (
          <View style={styles.finalWarn}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={styles.finalWarnText}>
              {safetyCount} safety / movement issue{safetyCount > 1 ? 's' : ''} recorded — these will be flagged in the inspection report.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={() => show('Draft saved')} />
          <Button label="Back" variant="outline" leftIcon="chevron-back" fitContent onPress={onBack} />
        </View>
        <Button label="Save Notes & Post Project" variant="primaryGradient" leftIcon="checkmark" onPress={handleComplete} />
      </SafeAreaView>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' },
  title: { ...typography.h3, color: colors.white, fontSize: 16 },

  safetyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  safetyText: { ...typography.caption, fontWeight: '700', color: colors.danger },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  mt: { marginTop: spacing.sm },
  miniLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.xs },

  /* Movement items */
  movItem: { paddingTop: spacing.md },
  movItemBorder: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md },
  movHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  movLabel: { ...typography.bodySm, fontWeight: '600', color: colors.textSecondary, flex: 1, marginRight: spacing.sm },
  notedBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.primaryTint },
  notedText: { fontSize: 9, fontWeight: '800', color: colors.danger, letterSpacing: 0.4 },
  dangerInput: { borderColor: '#FCA5A5', backgroundColor: '#FFF7F7' },

  /* No access */
  noAccessCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  noAccessTitle: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  dashedBtnText: { ...typography.bodySm, fontWeight: '700', color: colors.textSecondary },

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
  textarea: { minHeight: 110 },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },

  /* Cards: warn / ok / info */
  warnCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.accentOrange, borderWidth: 1, borderColor: '#F59E0B', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  warnTitle: { ...typography.caption, fontWeight: '700', color: colors.accentOrangeFg, marginBottom: 2 },
  warnText: { ...typography.caption, color: colors.accentOrangeFg, lineHeight: 16 },
  okCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accentGreen, borderWidth: 1, borderColor: '#86EFAC', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  okText: { ...typography.caption, fontWeight: '600', color: colors.barGreen, flex: 1 },
  infoCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.infoBg, borderWidth: 1, borderColor: colors.infoBorder, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  infoText: { ...typography.caption, color: colors.infoFg, lineHeight: 16, flex: 1 },

  /* Gated damage */
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

  finalWarn: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: '#FECACA', borderRadius: radius.md, padding: spacing.md },
  finalWarnText: { ...typography.caption, color: colors.danger, lineHeight: 16, flex: 1 },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
