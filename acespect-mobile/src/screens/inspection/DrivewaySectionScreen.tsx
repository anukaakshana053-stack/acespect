import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../../components/ui';
import { usePhotoCapture, CaptureOptions } from '../../hooks/usePhotoCapture';
import { CapturedPhoto } from '../../types/photo';
import { useInspectionDraft } from '../../context/InspectionDraftContext';

/** Crack width range → representative millimetres for the report. */
const WIDTH_MM: Record<string, number> = {
  'Hairline (<0.1mm)': 0.1,
  '0.1–1 mm': 1,
  '1–2 mm': 2,
  '2–5 mm': 5,
  '>5 mm': 6,
};
const metersToMm = (m: string): number => {
  const n = parseFloat(m);
  return Number.isNaN(n) ? 0 : Math.round(n * 1000);
};

/* ─── Types ────────────────────────────────────────────────────────── */
type CrackEntry = {
  id: number;
  location: string;
  direction: string;
  width: string;
  length: string;
  startingPoint: string;
};

type Driveway = {
  id: number;
  available: 'present' | 'none';
  location: string;
  material: string;
  condition: string;
  obstructions: string[];
  obstructionOther: string;
  notableDamage: 'yes' | 'no' | null;
  safetyHazard: 'yes' | 'no' | null;
  cracks: CrackEntry[];
  observations: string[];
  observationOther: string;
  notes: string;
};

type Photo = { id: number; uri: string; caption: string; num: string };

/* ─── Static option data ───────────────────────────────────────────── */
// Condition colours form a legend, so they live with the data, not in the
// shared palette.
const CONDITIONS = [
  { key: 'new', label: 'New condition', color: '#16A34A' },
  { key: 'fair', label: 'Fair condition', color: '#84CC16' },
  { key: 'mid', label: 'Mid range', color: '#F59E0B' },
  { key: 'poor', label: 'Poor condition', color: '#EF4444' },
  { key: 'damaged', label: 'Damage noted', color: '#991B1B' },
];

const MATERIALS = ['Concrete', 'Asphalt', 'Pavers', 'Exposed Agg.', 'Gravel', 'Other'];
const LOCATIONS = ['Front', 'Rear', 'Left Side', 'Right Side'];
const OBSTRUCTIONS = [
  'Parked vehicle',
  'Vegetation',
  'Stored goods / items',
  'Building materials',
  'Other (specify)',
];
const OBSERVATIONS = [
  'Vehicle parking / settlement',
  'Tyre marks',
  'Surface damage / spalling',
  'Cracking',
  'Edge damage',
  'Subsidence',
  'Other (specify)',
];
const DIRECTIONS = ['Horizontal', 'Vertical', 'Diagonal', 'Random / Map'];
const WIDTHS = ['Hairline (<0.1mm)', '0.1–1 mm', '1–2 mm', '2–5 mm', '>5 mm'];

function createDriveway(n: number): Driveway {
  return {
    id: n,
    available: 'present',
    location: 'Front',
    material: 'Concrete',
    condition: 'fair',
    obstructions: [],
    obstructionOther: '',
    notableDamage: null,
    safetyHazard: null,
    cracks: [{ id: 1, location: '', direction: '', width: '', length: '', startingPoint: '' }],
    observations: [],
    observationOther: '',
    notes: '',
  };
}

/* ─── Small building blocks ────────────────────────────────────────── */
function SectionLabel({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <Text style={styles.sectionLabel}>
      {n != null && <Text style={styles.sectionNum}>{n}. </Text>}
      {children}
    </Text>
  );
}

/** White card matching the app's SectionCard look (no accent bar). */
function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

/** Single-select chip row. */
function PillSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.pillWrap}>
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Multi-select chip row. */
function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.pillWrap}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => onToggle(o)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.flex1}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

/** Yes / No control (uses the blue/red selected styling from the mock). */
function YesNo({
  value,
  onChange,
}: {
  value: 'yes' | 'no' | null;
  onChange: (v: 'yes' | 'no') => void;
}) {
  return (
    <View style={styles.row}>
      {(['yes', 'no'] as const).map((v) => {
        const active = value === v;
        const accent = v === 'yes' ? colors.barBlue : colors.primary;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[
              styles.yesNo,
              active && { borderColor: accent, backgroundColor: v === 'yes' ? colors.accentBlue : colors.primaryTint },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.yesNoText, { color: active ? accent : colors.textMuted }]}>
              {v === 'yes' ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Condition selector ───────────────────────────────────────────── */
function ConditionSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {CONDITIONS.map((c) => {
        const active = value === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            style={[styles.conditionRow, active && { borderColor: c.color, backgroundColor: colors.surfaceAlt }]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text
              style={[
                styles.conditionText,
                { color: active ? c.color : colors.textMuted, fontWeight: active ? '700' : '500' },
              ]}
            >
              {c.label}
            </Text>
            {active && <Ionicons name="checkmark" size={16} color={c.color} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Crack card ───────────────────────────────────────────────────── */
function CrackCard({
  crack,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  crack: CrackEntry;
  index: number;
  onUpdate: (updates: Partial<CrackEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <View style={styles.crackCard}>
      <View style={styles.crackHeader}>
        <View style={styles.row}>
          <View style={styles.crackBadge}>
            <Text style={styles.crackBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.crackTitle}>Crack {index + 1}</Text>
        </View>
        {canRemove && (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`Remove crack ${index + 1}`}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.crackBody}>
        <View style={styles.row}>
          <LabeledInput
            label="LOCATION"
            placeholder="e.g. Centre, Near kerb"
            value={crack.location}
            onChangeText={(v) => onUpdate({ location: v })}
          />
          <LabeledInput
            label="STARTING POINT"
            placeholder="e.g. Near garage"
            value={crack.startingPoint}
            onChangeText={(v) => onUpdate({ startingPoint: v })}
          />
        </View>

        <View>
          <Text style={styles.miniLabel}>DIRECTION</Text>
          <PillSelect options={DIRECTIONS} value={crack.direction} onChange={(v) => onUpdate({ direction: v })} />
        </View>

        <View>
          <Text style={styles.miniLabel}>WIDTH</Text>
          <PillSelect options={WIDTHS} value={crack.width} onChange={(v) => onUpdate({ width: v })} />
        </View>

        <LabeledInput
          label="LENGTH (M)"
          placeholder="e.g. 0.5"
          value={crack.length}
          onChangeText={(v) => onUpdate({ length: v })}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}

/* ─── Photographs ──────────────────────────────────────────────────── */
function DrivewayPhotos({ driveNum }: { driveNum: number }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const { takePhoto, pickFromLibrary } = usePhotoCapture();

  const addPhoto = async (
    capture: (opts?: CaptureOptions) => Promise<CapturedPhoto | null>,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const shot = await capture({
        sectionKey: `driveway:${driveNum}`,
        sortOrder: photos.length,
        caption: `Driveway ${driveNum}`,
      });
      if (!shot) return;
      setPhotos((p) => [
        ...p,
        {
          id: Date.now(),
          uri: shot.uri,
          caption: shot.caption || `Driveway ${driveNum}`,
          num: `IMG_${String(p.length + 1).padStart(3, '0')}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <View style={styles.photoHeader}>
        <View style={styles.flex1}>
          <SectionLabel>Photographs</SectionLabel>
          <Text style={styles.helper}>
            Showing {photos.length} photo{photos.length !== 1 ? 's' : ''} for Driveway {driveNum}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{photos.length}</Text>
        </View>
      </View>

      <View style={styles.photoGrid}>
        {photos.map((p) => (
          <View key={p.id} style={styles.photoCell}>
            <Image source={{ uri: p.uri }} style={styles.photoImg} />
            <View style={styles.photoMeta}>
              <Text style={styles.photoNum}>{p.num}</Text>
              <Text style={styles.photoCaption} numberOfLines={1}>
                {p.caption}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <Button
          label={busy ? 'Opening…' : 'Take Photo'}
          variant="primaryGradient"
          leftIcon="camera-outline"
          loading={busy}
          onPress={() => addPhoto(takePhoto)}
          style={styles.flex1}
        />
        <Button
          label="Upload Photo"
          variant="outline"
          leftIcon="image-outline"
          onPress={() => addPhoto(pickFromLibrary)}
          style={styles.flex1}
        />
      </View>

      <Text style={styles.photoFootnote}>
        Photos are automatically numbered and linked to this driveway item
      </Text>
    </View>
  );
}

/* ─── Screen ───────────────────────────────────────────────────────── */
interface DrivewaySectionScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onGoHome?: () => void;
}

export function DrivewaySectionScreen({ onBack, onComplete, onGoHome }: DrivewaySectionScreenProps) {
  const [driveways, setDriveways] = useState<Driveway[]>([createDriveway(1)]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const draft = useInspectionDraft();

  const d = driveways[currentIdx];

  const upd = (updates: Partial<Driveway>) =>
    setDriveways((prev) => prev.map((dw, i) => (i === currentIdx ? { ...dw, ...updates } : dw)));

  const toggleArr = (field: 'obstructions' | 'observations', item: string) => {
    const cur = d[field];
    upd({ [field]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] });
  };

  const addCrack = () => {
    const newId = Math.max(...d.cracks.map((c) => c.id), 0) + 1;
    upd({
      cracks: [...d.cracks, { id: newId, location: '', direction: '', width: '', length: '', startingPoint: '' }],
    });
  };

  const updateCrack = (crackId: number, updates: Partial<CrackEntry>) =>
    upd({ cracks: d.cracks.map((c) => (c.id === crackId ? { ...c, ...updates } : c)) });

  const removeCrack = (crackId: number) => {
    if (d.cracks.length <= 1) return;
    upd({ cracks: d.cracks.filter((c) => c.id !== crackId) });
  };

  const addDriveway = () => {
    setDriveways((prev) => [...prev, createDriveway(prev.length + 1)]);
    setCurrentIdx(driveways.length);
  };

  const atFirst = currentIdx === 0;
  const atLast = currentIdx === driveways.length - 1;

  const conditionLabel = (c: string) => CONDITIONS.find((x) => x.key === c)?.label ?? c;

  const handleComplete = () => {
    const primary = driveways[0];
    const damages = driveways.flatMap((dw) =>
      dw.cracks
        .filter((c) => c.location || c.direction || c.width || c.length)
        .map((c) => ({
          type: 'Crack',
          location: c.location,
          direction: c.direction,
          widthMm: WIDTH_MM[c.width] ?? 0,
          lengthMm: metersToMm(c.length),
          notes: c.startingPoint,
        })),
    );
    draft.setSection({
      key: 'driveway',
      name: 'Driveway',
      icon: '🚗',
      order: 2,
      status: 'complete',
      reportText:
        primary.available === 'none'
          ? 'There is no driveway.'
          : `The driveway is located to the ${primary.location.toLowerCase()} of the property, constructed of ${primary.material.toLowerCase()}, and is in ${conditionLabel(primary.condition).toLowerCase()}.${primary.notes ? ' ' + primary.notes : ''}`,
      fields: {
        location: primary.location,
        material: primary.material,
        condition: conditionLabel(primary.condition),
        obstructions: primary.obstructions.join(', '),
        notableDamage: primary.notableDamage ?? '',
        safetyHazard: primary.safetyHazard ?? '',
        observations: primary.observations.join(', '),
      },
      damages,
    });
    onComplete();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.headerGradientFrom, colors.headerGradientTo]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={16} color={colors.textOnDarkMuted} />
              <Text style={styles.backText}>External Inspection</Text>
            </Pressable>
            <View style={styles.row}>
              <Pressable style={styles.headerIconBtn} hitSlop={8} accessibilityLabel="Save draft">
                <Ionicons name="save-outline" size={16} color={colors.white} />
              </Pressable>
              {onGoHome && (
                <Pressable onPress={onGoHome} style={styles.headerIconBtn} hitSlop={8} accessibilityLabel="Home">
                  <Ionicons name="home-outline" size={16} color={colors.white} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.headerTitleRow}>
            <View style={styles.flex1}>
              <Text style={styles.headerTitle}>Driveway {currentIdx + 1}</Text>
              <View style={styles.statusChip}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: d.available === 'present' ? colors.success : colors.textMuted },
                  ]}
                />
                <Text style={styles.statusChipText}>
                  {d.available === 'present' ? 'Driveway Present' : 'No Driveway'}
                </Text>
              </View>
            </View>

            {/* Pagination */}
            <View style={styles.row}>
              <Pressable
                onPress={() => !atFirst && setCurrentIdx((i) => i - 1)}
                disabled={atFirst}
                style={[styles.pagerBtn, atFirst && styles.pagerBtnDisabled]}
                hitSlop={6}
              >
                <Ionicons
                  name="chevron-back"
                  size={14}
                  color={atFirst ? 'rgba(255,255,255,0.25)' : colors.white}
                />
              </Pressable>
              <View style={styles.pagerLabel}>
                <Text style={styles.pagerCount}>
                  {currentIdx + 1} of {driveways.length}
                </Text>
                <Text style={styles.pagerSub}>Driveways</Text>
              </View>
              <Pressable
                onPress={() => !atLast && setCurrentIdx((i) => i + 1)}
                disabled={atLast}
                style={[styles.pagerBtn, atLast && styles.pagerBtnDisabled]}
                hitSlop={6}
              >
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={atLast ? 'rgba(255,255,255,0.25)' : colors.white}
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Availability */}
        <Card>
          <SectionLabel n={1}>Availability</SectionLabel>
          <View style={{ gap: spacing.sm }}>
            {(['present', 'none'] as const).map((v) => {
              const active = d.available === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => upd({ available: v })}
                  style={[styles.stackOption, active && styles.stackOptionActive]}
                >
                  <Text style={[styles.stackOptionText, active && styles.stackOptionTextActive]}>
                    {v === 'present' ? 'Driveway Present' : 'No Driveway'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Location */}
        <Card>
          <SectionLabel n={2}>Location</SectionLabel>
          <PillSelect options={LOCATIONS} value={d.location} onChange={(v) => upd({ location: v })} />
        </Card>

        {/* Material */}
        <Card>
          <SectionLabel n={3}>Material Type</SectionLabel>
          <PillSelect options={MATERIALS} value={d.material} onChange={(v) => upd({ material: v })} />
        </Card>

        {/* Condition */}
        <Card>
          <SectionLabel n={4}>General Condition</SectionLabel>
          <ConditionSelector value={d.condition} onChange={(v) => upd({ condition: v })} />
        </Card>

        {/* Obstructions */}
        <Card>
          <SectionLabel n={5}>Visibility Obstructions</SectionLabel>
          <Text style={styles.helper}>Select all that apply</Text>
          <ChipMultiSelect
            options={OBSTRUCTIONS}
            selected={d.obstructions}
            onToggle={(v) => toggleArr('obstructions', v)}
          />
          {d.obstructions.includes('Other (specify)') && (
            <TextInput
              style={[styles.input, styles.otherInput]}
              placeholder="Enter details..."
              placeholderTextColor={colors.textMuted}
              value={d.obstructionOther}
              onChangeText={(v) => upd({ obstructionOther: v })}
            />
          )}
        </Card>

        {/* Notable damage */}
        <Card>
          <SectionLabel n={6}>Notable Damage</SectionLabel>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FieldLabel>Damage observed?</FieldLabel>
              <YesNo value={d.notableDamage} onChange={(v) => upd({ notableDamage: v })} />
            </View>
            <View style={styles.flex1}>
              <FieldLabel>Safety hazard?</FieldLabel>
              <YesNo value={d.safetyHazard} onChange={(v) => upd({ safetyHazard: v })} />
            </View>
          </View>
        </Card>

        {/* Crack details */}
        <Card>
          <View style={styles.cardHeaderRow}>
            <SectionLabel n={7}>Crack Details</SectionLabel>
            <View style={styles.crackCountBadge}>
              <Text style={styles.crackCountText}>
                {d.cracks.length} crack{d.cracks.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {d.cracks.map((crack, i) => (
            <View key={crack.id} style={{ marginBottom: spacing.md }}>
              <CrackCard
                crack={crack}
                index={i}
                onUpdate={(updates) => updateCrack(crack.id, updates)}
                onRemove={() => removeCrack(crack.id)}
                canRemove={d.cracks.length > 1}
              />
            </View>
          ))}

          <Pressable onPress={addCrack} style={styles.dashedBtn}>
            <Ionicons name="add" size={16} color={colors.barBlue} />
            <Text style={styles.dashedBtnText}>Add Another Crack</Text>
          </Pressable>
        </Card>

        {/* Observations */}
        <Card>
          <SectionLabel n={8}>Common Observations</SectionLabel>
          <Text style={styles.helper}>Select all that apply</Text>
          <ChipMultiSelect
            options={OBSERVATIONS}
            selected={d.observations}
            onToggle={(v) => toggleArr('observations', v)}
          />
          {d.observations.includes('Other (specify)') && (
            <TextInput
              style={[styles.input, styles.otherInput]}
              placeholder="Other observation..."
              placeholderTextColor={colors.textMuted}
              value={d.observationOther}
              onChangeText={(v) => upd({ observationOther: v })}
            />
          )}
        </Card>

        {/* Notes */}
        <Card>
          <SectionLabel n={9}>Inspector Notes</SectionLabel>
          <Text style={styles.helper}>Optional</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Add any additional observations about the driveway..."
            placeholderTextColor={colors.textMuted}
            value={d.notes}
            onChangeText={(v) => upd({ notes: v })}
            multiline
            textAlignVertical="top"
          />
        </Card>

        {/* Photos */}
        <Card>
          <DrivewayPhotos driveNum={currentIdx + 1} />
        </Card>
      </ScrollView>

      {/* ── Footer ── */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Button label="Save Draft" variant="outline" leftIcon="save-outline" fitContent onPress={onBack} />
          <Button
            label="Add Driveway"
            variant="outline"
            leftIcon="add"
            fitContent
            onPress={addDriveway}
          />
        </View>
        <Button
          label={`Complete Driveway ${currentIdx + 1}`}
          variant="primaryGradient"
          leftIcon="checkmark"
          onPress={handleComplete}
        />
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.bodySm, color: colors.textOnDarkMuted },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  headerTitle: { ...typography.h2, color: colors.white },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { ...typography.caption, color: colors.textOnDarkMuted },
  pagerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  pagerBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  pagerLabel: { alignItems: 'center', minWidth: 56 },
  pagerCount: { ...typography.caption, fontWeight: '700', color: colors.white },
  pagerSub: { fontSize: 9.5, color: 'rgba(255,255,255,0.45)' },

  /* Body */
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  sectionLabel: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sectionNum: { color: colors.barBlue },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  fieldLabel: { ...typography.bodySm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },

  /* Layout helpers */
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },

  /* Pills */
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { borderColor: colors.barBlue, backgroundColor: colors.barBlue },
  pillText: { ...typography.caption, color: colors.textSecondary },
  pillTextActive: { color: colors.white, fontWeight: '700' },

  /* Stacked options (availability) */
  stackOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stackOptionActive: { borderColor: colors.barBlue, backgroundColor: colors.accentBlue },
  stackOptionText: { ...typography.bodySm, fontWeight: '500', color: colors.textMuted },
  stackOptionTextActive: { color: colors.barBlue, fontWeight: '700' },

  /* Yes / No */
  yesNo: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  yesNoText: { ...typography.bodySm, fontWeight: '700' },

  /* Condition */
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  conditionText: { ...typography.bodySm, flex: 1 },

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
  otherInput: { marginTop: spacing.sm },
  textarea: { minHeight: 88 },

  /* Crack card */
  crackCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  crackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  crackBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.barBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crackBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
  crackTitle: { ...typography.bodySm, fontWeight: '700', color: colors.textPrimary },
  crackBody: { padding: spacing.md, gap: spacing.md },
  crackCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentBlue,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  crackCountText: { fontSize: 10, fontWeight: '700', color: colors.barBlue },

  /* Dashed add button */
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.barBlue,
  },
  dashedBtnText: { ...typography.bodySm, fontWeight: '600', color: colors.barBlue },

  /* Photos */
  photoHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.textPrimary,
  },
  countBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photoCell: {
    width: '31.5%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoImg: { width: '100%', height: 72 },
  photoMeta: { padding: spacing.xs },
  photoNum: { fontSize: 8.5, fontWeight: '700', color: colors.textPrimary },
  photoCaption: { fontSize: 8, color: colors.textMuted },
  photoFootnote: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  /* Footer */
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
