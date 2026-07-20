// One-off content overlay: publishes a v2 for the Dilapidation + Apartment
// profile's job-info, roof_chimneys, elevations, garage_carport_sheds,
// internal_areas and notes sections, adding the detailed apartment-specific
// sub-area checklists (roof/eaves/gutters, external walls/cladding/windows/
// balconies, garage & car space, internal building systems, structural &
// safety) ported from a reference building-inspection checklist. Every
// other (inspectionType, propertyType) lineage is untouched -- this is
// purely additive content for one profile, using the existing versioning
// flow (archive prior published row, publish the new one) so any inspection
// already mid-draft keeps whatever version it started with.
import { prisma } from '../lib/prisma';
import { TemplateField, TemplateFieldOption } from '../modules/templates/templates.schemas';

const INSPECTION_TYPE = 'dilapidation';
const PROPERTY_TYPE = 'apartment';

function numbered(fields: Omit<TemplateField, 'order'>[]): TemplateField[] {
  return fields.map((f, i) => ({
    ...f,
    order: i,
    itemFields: f.itemFields ? numbered(f.itemFields as Omit<TemplateField, 'order'>[]) : undefined,
  }));
}

const opt = (value: string, label: string): TemplateFieldOption => ({ value, label });
const items = (labels: string[]): TemplateFieldOption[] => labels.map((l, i) => opt(`item${i}`, l));

/**
 * One inspection sub-area (e.g. "Gutters", "External Walls"): an optional
 * Applicability pill-select (when the area can be marked not-applicable /
 * not-accessible), gated leaf fields, gated checklist(s) of curated defect
 * observations, a comments box, and a photo capture field -- all tagged
 * with the same `sectionLetter` group label so the mobile/web renderers
 * show them under one named heading.
 */
function subArea(opts: {
  prefix: string;
  group: string;
  naOptions?: { value: string; label: string }[];
  fields?: Omit<TemplateField, 'order' | 'sectionLetter' | 'gate'>[];
  checkGroups?: { heading?: string; options: string[] }[];
  photos?: boolean;
}): Omit<TemplateField, 'order'>[] {
  const { prefix, group, naOptions, fields = [], checkGroups = [], photos = true } = opts;
  const out: Omit<TemplateField, 'order'>[] = [];
  const hasNA = !!naOptions?.length;

  if (hasNA) {
    out.push({
      key: `${prefix}_applicability`,
      label: 'Applicability',
      type: 'pill-select',
      options: [opt('applicable', 'Assessed'), ...naOptions!.map((o) => opt(o.value, o.label))],
      sectionLetter: group,
    });
  }
  const gate = hasNA ? { fieldKey: `${prefix}_applicability`, equals: 'applicable' } : undefined;

  for (const f of fields) {
    out.push({ ...f, key: `${prefix}_${f.key}`, sectionLetter: group, gate });
  }
  checkGroups.forEach((g, i) => {
    out.push({
      key: `${prefix}_checks${i}`,
      label: g.heading ?? 'Observations',
      type: 'chip-multiselect',
      allowOther: true,
      options: items(g.options),
      sectionLetter: group,
      gate,
    });
  });
  out.push({ key: `${prefix}_comments`, label: 'Comments', type: 'textarea', maxLength: 500, sectionLetter: group, gate });
  if (photos) out.push({ key: `${prefix}_photos`, label: 'Photos', type: 'photos', sectionLetter: group, gate });
  return out;
}

const CONDITION = ['Good', 'Satisfactory', 'Fair', 'Average', 'Poor', 'Varying'];
const YES_NO: TemplateFieldOption[] = [opt('yes', 'Yes'), opt('no', 'No')];
const yesno = (key: string, label: string) => ({ key, label, type: 'yesno' as const, options: YES_NO });
const chips = (key: string, label: string, options: string[]) => ({ key, label, type: 'pill-select' as const, options: items(options) });

// ── Roof (roof_chimneys) ──────────────────────────────────────────
const ROOF_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'roofcov', group: 'Roof Covering',
    naOptions: [{ value: 'na-apt', label: 'Apartment complex – not applicable' }],
    checkGroups: [{ options: ['Visible damage to roof covering', 'Refer to strata/body corporate for roof maintenance'] }],
  }),
  ...subArea({
    prefix: 'eaves', group: 'Eaves / Soffits',
    naOptions: [{ value: 'na-apt', label: 'Apartment complex – not applicable' }, { value: 'no-eaves', label: 'There are no eaves nor soffits' }],
    fields: [chips('material', 'Constructed of', ['Plasterboard', 'Fibrous cement', 'Timber', 'Aluminium', 'Other']), chips('condition', 'Condition', CONDITION)],
  }),
  ...subArea({
    prefix: 'fascia', group: 'Fascia',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('material', 'Constructed of', ['Timber', 'Colorbond steel', 'Timber and rolled sheet metal', 'Other']), chips('condition', 'Condition', CONDITION)],
    checkGroups: [{ options: ['Need normal maintenance', 'Decayed and need repair'] }],
  }),
  ...subArea({
    prefix: 'gutters', group: 'Gutters',
    naOptions: [{ value: 'na-apt', label: 'Apartment complex – not visible' }],
    fields: [
      chips('gutterType', 'Gutter type', ['Perimeter gutters', 'Boxed gutters', 'Both']),
      chips('material', 'Constructed of', ['Colorbond', 'Zincalume', 'PVC', 'Other']),
      chips('condition', 'Condition', CONDITION),
    ],
    checkGroups: [{ options: ['Need normal maintenance', 'Require repair', 'Require replacement', 'Require partial replacement', 'Evidence of overflowing gutters – engage a licensed plumber'] }],
  }),
  ...subArea({
    prefix: 'downpipes', group: 'Downpipes',
    naOptions: [{ value: 'na-apt', label: 'Apartment complex – not visible' }],
    fields: [chips('material', 'Fabricated of', ['PVC', 'Colorbond', 'Zincalume', 'Other']), chips('condition', 'Condition', CONDITION)],
    checkGroups: [{ options: ['Require maintenance to the joints', 'Require normal maintenance', 'No attention required', 'The downpipes are leaking – engage a licensed plumber'] }],
  }),
];

// ── External (elevations) ─────────────────────────────────────────
const EXTERNAL_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'extwalls', group: 'External Walls',
    fields: [
      { key: 'material', label: 'External walls constructed of', type: 'text' },
      yesno('rendered', 'Rendered'),
      chips('condition', 'Condition (in relation to age)', ['Satisfactory', 'Fair', 'Average', 'Poor', 'Average to poor']),
      yesno('majorCracking', 'Signs of major cracking'),
      yesno('sigWeathering', 'Signs of significant weathering'),
      yesno('generallyStable', 'Walls generally stable'),
    ],
    checkGroups: [
      { heading: 'Cracking assessment', options: ['Minor cracking visible consistent with age – not structural', 'Cracking over window/door heads – typical, not structural unless bricks loose', 'Major cracking requiring repairs – not yet structural but attend soon', 'Immediate repairs required – consider consulting structural engineer'] },
      { heading: 'Defect items', options: ['Loose bricks', 'Drummy render', 'Fretting mortar requires repointing', 'Evidence of rising damp', 'Patching and re-pointing where appliances/fittings removed', 'Mortar out of joints at lower courses – needs repointing', 'Spalling to some bricks', 'Weep holes not visible', 'Weep holes covered or partly covered – keep clear', 'Sub-floor vents covered or partly covered – keep clear'] },
    ],
  }),
  ...subArea({
    prefix: 'cladding', group: 'Cladding',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [
      { key: 'material', label: 'Cladding constructed of', type: 'text' },
      yesno('rendered', 'Rendered'),
      chips('condition', 'Condition (in relation to age)', ['Satisfactory', 'Fair', 'Average', 'Poor', 'Average to poor']),
      yesno('sigCracking', 'Signs of significant cracking'),
      yesno('sigWeathering', 'Signs of significant weathering'),
      chips('requires', 'Cladding requires', ['No repairs', 'Normal maintenance', 'Completion of render', 'Re-painting']),
    ],
    checkGroups: [{ options: ['Some weathering visible – requires maintenance or replacement', 'Breakage visible to cement sheet wall cladding', 'Cladding may contain asbestos'] }],
  }),
  ...subArea({
    prefix: 'windowsext', group: 'Windows / Window Frames',
    fields: [
      chips('material', 'Windows and frames constructed of', ['Timber', 'Aluminium', 'Anodized', 'Timber and aluminium', 'Other']),
      chips('condition', 'Condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']),
      chips('requires', 'Require', ['Normal maintenance', 'Repairs', 'No attention']),
      chips('glazingBeads', 'Glazing beads appear', ['Sound', 'Serviceable', 'Poor']),
      yesno('securityScreens', 'Security screens installed'),
      yesno('rollerShutters', 'Roller shutters installed'),
    ],
    checkGroups: [{ options: ['Aluminium frame edge has come away from rubber seal and glazing', 'Broken glazed pane', 'Water ingress to glazing frame – replace putty and seal', 'Weathering surface damage to timber frames – requires painting', 'Some wood decay needs repair', 'Non-timber windows: confirm glazing beads to be replaced by neoprene glazing rubber'] }],
  }),
  ...subArea({
    prefix: 'frontdoor', group: 'Front Door & Frame',
    fields: [
      chips('material', 'Constructed of', ['Timber', 'Aluminium', 'Pressed metal', 'Other']),
      chips('condition', 'Condition', CONDITION),
      chips('requires', 'Require', ['No repairs', 'Normal maintenance', 'Re-painting']),
      yesno('secScreen', 'Front door security screen'),
      yesno('deadlocks', 'Deadlocks fitted'),
      chips('doorCloser', 'Door closer working', ['NA', 'Yes', 'No']),
    ],
  }),
  ...subArea({
    prefix: 'otherdoors', group: 'Other External Doors',
    fields: [
      chips('style', 'Doors are', ['Solid-core', 'Hollow-core', 'Glazed', 'Paneled', 'Aluminium sliding', 'Variety of styles']),
      chips('condition', 'Condition generally', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']),
      chips('requires', 'Generally require', ['No repairs', 'Normal maintenance', 'Re-painting']),
    ],
    checkGroups: [{ options: ['Doors are delaminating', 'Doors are binding – require 2mm clearance', 'Edges of door require sealing to avoid water damage', 'Door latch not engaging'] }],
  }),
  ...subArea({
    prefix: 'balconies', group: 'Balconies',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [
      chips('material', 'Balconies constructed of', ['Steel', 'Timber', 'Concrete', 'Other']),
      chips('condition', 'Condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']),
      yesno('adequatelyFixed', 'Appear adequately fixed to building'),
      chips('handRails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no']),
      chips('handRailCond', 'Condition of hand rails', CONDITION),
    ],
    checkGroups: [{ heading: 'Handrail / balustrade defects', options: ['There is decay to hand rails', 'Hand rails do not comply with current Australian Standards', 'Balustrade is loose and requires maintenance', 'Handrail/balustrade height is less than 1000mm – non-compliant', 'Balustrade spacing between railings more than 125mm – non-compliant', 'Water appears to pond on balcony floor – floor falls not channelling to drain', 'Balcony floor drainage may be blocked – recommend cleaning as maintenance'] }],
  }),
  ...subArea({
    prefix: 'subfloor', group: 'Sub-Floor', photos: false,
    naOptions: [{ value: 'na-slab', label: 'Not applicable – constructed on concrete slab' }, { value: 'na-apt', label: 'Apartment complex – not assessable' }],
  }),
];

// ── Garage / Car Space (garage_carport_sheds) ───────────────────────
const GARAGE_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'carspace', group: 'Garage / Car Space',
  fields: [
    chips('type', 'Car space type', ['Garage in basement', 'Car bay in basement', 'No car space allocated to this apartment']),
    chips('condition', 'General condition', CONDITION),
    yesno('reqAttention', 'Requires attention'),
  ],
  checkGroups: [{ options: ['Cracking to walls', 'Repairs required', 'Damp visible to external walls', 'Minor cracking to hardstand – monitor from time to time', 'Storage cage in basement'] }],
});

// ── Internal building systems (internal_areas, appended after "rooms") ──
const INTERNAL_SYSTEM_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'partywalls', group: 'Party Walls',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [
      { key: 'location', label: 'Party wall(s) location', type: 'text' },
      yesno('extendsToRoof', 'Party wall extends to underside of roof cover'),
      yesno('fireBarrier', 'Appropriately constructed as fire barrier'),
    ],
    checkGroups: [{ options: ['Roof timbers passing through party wall – brickwork does not go to underside of roof covering'] }],
  }),
  ...subArea({
    prefix: 'ceilings', group: 'Ceilings',
    fields: [
      chips('material', 'Ceiling material', ['Plasterboard', 'Lathe and plaster', 'Exposed concrete', 'Other']),
      chips('cornices', 'Cornices are', ['Cove', 'Ornate', 'Traditional', 'Varying', 'Timber moulding', 'Shadowline', 'Square set']),
      chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying']),
      yesno('adequatelyFixed', 'Adequately fixed'),
    ],
    checkGroups: [{ options: ['Ceiling not adequately attached to ceiling frame – has deflected significantly', 'Minor imperfections / hairline cracks consistent with age – not a significant defect', 'Presence of flaking / mould / mildew to paintwork due to excessive moisture in wet areas – install mechanical ventilation', 'Minor paint flaking', 'Watermarks and staining visible due to a water leak'] }],
  }),
  ...subArea({
    prefix: 'intwalls', group: 'Internal Walls',
    fields: [chips('material', 'Constructed of', ['Plasterboard', 'Lathe and plaster', 'Other']), chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying'])],
    checkGroups: [{ options: ['There is no major cracking nor other signs of significant movement', 'Minor cracking over doorways and/or windows consistent with age – not a structural concern', 'Minor cracking consistent with age, due to normal settlement/movement', 'There is major cracking requiring attention', 'Structural cracks requiring investigation by a structural engineer', 'Drummy / loose / flaking plaster', 'Damp from shower/bath in adjacent room to the base of the wall'] }],
  }),
  ...subArea({
    prefix: 'floors', group: 'Floors',
    fields: [
      chips('material', 'Generally constructed of', ['Concrete', 'Polished concrete', 'Timber', 'Other']),
      chips('coverings', 'Floor coverings', ['Floating timber', 'Tiles', 'Laminate flooring', 'Vinyl', 'Carpet', 'Other']),
    ],
    checkGroups: [{ options: ['The tiled areas do not require attention', 'No significant cracks were seen', 'Floor tiling drummy', 'Concrete floor has minor cracking caused by rate of drying – not of a structural nature', 'Timber floors are creaking / bouncy and require refixing', 'Floors unlevel'] }],
  }),
  ...subArea({
    prefix: 'intstairs', group: 'Internal Stairs',
    naOptions: [{ value: 'single-level', label: 'Property is single level – no internal stairs' }],
    fields: [chips('material', 'Constructed of', ['Steel', 'Concrete', 'Timber', 'Other']), chips('condition', 'Condition', CONDITION), chips('handrails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no'])],
    checkGroups: [{ heading: 'Compliance & safety', options: ['The handrails/balustrade height is less than 1000mm and does not comply with Australian Standards', 'The balustrade spacing between railings is more than 125mm and does not comply with Australian Standards', 'The balustrade has horizontal rails that may be climbable by a child – safety concern', 'Stair treads / risers are not equal and do not comply with current Australian Standards', 'Stair risers are higher than the maximum 190mm and do not comply with current Australian Standards', 'Stair treads are less than the minimum 240mm and do not comply with current Australian Standards'] }],
  }),
  ...subArea({
    prefix: 'intwindows', group: 'Windows (Internal)',
    fields: [
      chips('condition', 'Internal condition', CONDITION),
      yesno('locksGeneral', 'Locks are generally fitted'),
      chips('flywire', 'Flywire screens fitted to', ['Some windows', 'Most windows', 'All windows', 'None']),
      chips('flywireCondition', 'Flywire condition', CONDITION),
    ],
    checkGroups: [{ options: ['Windows are difficult to open and need servicing and maintenance', 'At upper windows, restrictors need to be fitted to maximum opening of 125mm – safety concern', 'Windows were locked and could not be opened to check operation'] }],
  }),
  ...subArea({
    prefix: 'intdoors', group: 'Internal Doors',
    fields: [chips('style', 'Generally', ['Panelled', 'Flush style', 'Several styles']), chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying'])],
    checkGroups: [{ options: ['Doors binding and need maintenance', 'Door furniture is loose / not latching'] }],
  }),
  ...subArea({
    prefix: 'cabinets', group: 'Cabinets',
    fields: [chips('condition', 'General condition', ['Good', 'Satisfactory', 'Fair', 'Average', 'Poor', 'Consistent with age'])],
    checkGroups: [{ options: ['Cabinet drawers are binding and need adjustment', 'Cabinet / robe doors are binding and need adjustment', 'Cabinet / robe doors do not close properly – need adjustment', 'Water damage / swelling to cabinet'] }],
  }),
  ...subArea({
    prefix: 'plumbing', group: 'Plumbing', photos: false,
    fields: [
      yesno('waterSupplyOn', 'Water supply on'),
      yesno('tapsNormal', 'All taps, showers, toilets operated normally'),
      yesno('waterHammer', 'Water hammer present'),
      yesno('drainsNormal', 'All sinks, vanities and showers drained normally'),
      yesno('waterLeaks', 'Water leaks to taps / waste pipes / showers'),
    ],
  }),
  ...subArea({
    prefix: 'gas', group: 'Gas', photos: false,
    naOptions: [{ value: 'na', label: 'Not applicable – no gas supply' }],
    fields: [
      chips('supplyType', 'Gas supply', ['Mains', 'LPG (cylinders)']),
      yesno('gasSupplyOn', 'Gas supply on'),
      yesno('detectedLeaks', 'Detectable leaks'),
      yesno('appliancesOperated', 'Appliances operated correctly'),
    ],
    checkGroups: [{ options: ['Consult a licensed gas fitter', 'Add to Safety Matters'] }],
  }),
  ...subArea({
    prefix: 'electrical', group: 'Electrical', photos: false,
    fields: [
      yesno('powerOn', 'Power supply on'),
      yesno('appliancesOperated', 'Lights, fans, appliances operated correctly'),
      chips('rcdCount', 'Number of RCDs', ['Nil', '1', '2', '3', '4', '5', 'Other']),
      yesno('batteryAlarms', 'Battery smoke alarms installed'),
      chips('batteryAlarmsCount', 'Battery smoke alarm count', ['1', '2', '3', 'Other']),
      yesno('hardwiredAlarms', 'Hardwired smoke alarms installed'),
      chips('hardwiredCount', 'Hardwired smoke alarm count', ['1', '2', '3', 'Other']),
      yesno('alarmsLocated', 'Smoke alarms within 1.5m of each sleeping area'),
    ],
    checkGroups: [{ options: ['Nil RCDs installed – add to Safety Matters', 'Smoke alarms not correctly located – refer to Safety Matters'] }],
  }),
  ...subArea({
    prefix: 'fireplace', group: 'Fireplace / Heater Insert',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('type', 'Type', ['Gas heater inserted', 'Electric heater inserted']), chips('count', 'Count', ['1', '2', '3']), yesno('operating', 'Operating at time of inspection')],
    checkGroups: [{ options: ['Requires normal maintenance', 'Recommend urgent servicing'] }],
  }),
];

// Extra common-area room instances folded into internal_areas' existing "rooms" repeating-group.
const COMMON_AREA_ROOM_INSTANCES = [
  { key: 'foyer', label: 'Foyer / Reception' },
  { key: 'lift_area', label: 'Letterboxes / Lift Area' },
  { key: 'meeting_room', label: 'Meeting Room / Wine Room' },
  { key: 'gymnasium', label: 'Gymnasium' },
  { key: 'roof_terrace', label: 'Roof Terrace / BBQ' },
];

// ── Structural & Safety (notes) ─────────────────────────────────────
const STRUCTURAL_SAFETY_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'structural', group: 'Structural Defects', photos: false,
    fields: [yesno('structurallySound', 'The unit is considered structurally sound')],
  }),
  ...subArea({
    prefix: 'majordefects', group: 'Major Defects', photos: false,
    fields: [yesno('freeOfMajorDefects', 'Property is free of major defects (in relation to its age)')],
  }),
  ...subArea({
    prefix: 'safety', group: 'Safety Matters',
    fields: [yesno('safetyMatters', 'Safety matters are evident')],
    checkGroups: [{ heading: 'Safety items', options: ['Smoke alarms not installed in required locations per AS 3.7.2.3', 'Insulation touching/covering recessed light fittings – fire hazard', 'Fibre cement sheeting that may contain asbestos (construction 1930s–mid 1980s)', 'Refer to Pool safety concerns', 'Refer to Stairs safety concerns', 'Refer to Trip hazard concerns'] }],
  }),
];

async function publishOverlay(sectionKey: string, buildFields: (existing: TemplateField[]) => TemplateField[]) {
  const published = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  const latest = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('no ADMIN user found');

  const existingFields = ((published?.fields as unknown as TemplateField[]) ?? []) as TemplateField[];
  const nextFields = numbered(buildFields(existingFields) as Omit<TemplateField, 'order'>[]);

  const draft = await prisma.inspectionTemplate.create({
    data: {
      inspectionType: INSPECTION_TYPE,
      propertyType: PROPERTY_TYPE,
      sectionKey,
      name: published?.name ?? sectionKey,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: nextFields as unknown as object,
      createdById: admin.id,
    },
  });

  await prisma.$transaction([
    prisma.inspectionTemplate.updateMany({
      where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' },
    }),
    prisma.inspectionTemplate.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`[apartment-dilapidation] published ${sectionKey} v${draft.version} (${nextFields.length} fields)`);
}

async function main() {
  await publishOverlay('job-info', (existing) => [
    ...existing,
    { key: 'unitNumber', label: 'Unit Number', type: 'text' } as TemplateField,
    { key: 'buildingName', label: 'Building Name', type: 'text' } as TemplateField,
  ]);

  await publishOverlay('roof_chimneys', () => ROOF_FIELDS as TemplateField[]);

  await publishOverlay('elevations', (existing) => [...existing, ...(EXTERNAL_FIELDS as TemplateField[])]);

  await publishOverlay('garage_carport_sheds', () => GARAGE_FIELDS as TemplateField[]);

  await publishOverlay('internal_areas', (existing) => {
    const rooms = existing.find((f) => f.key === 'rooms');
    if (rooms?.repeat?.fixedInstances) {
      rooms.repeat.fixedInstances = [...rooms.repeat.fixedInstances, ...COMMON_AREA_ROOM_INSTANCES];
    }
    return [...existing, ...(INTERNAL_SYSTEM_FIELDS as TemplateField[])];
  });

  await publishOverlay('notes', (existing) => [...(STRUCTURAL_SAFETY_FIELDS as TemplateField[]), ...existing]);

  await prisma.$disconnect();
}

void main();
