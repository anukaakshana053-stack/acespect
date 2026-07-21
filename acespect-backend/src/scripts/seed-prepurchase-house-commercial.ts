// One-off content overlay: publishes a v2 for BOTH the Pre-Purchase +
// Residential House and Pre-Purchase + Commercial Properties profiles'
// job-info, roof_chimneys, elevations, garage_carport_sheds, pool_spa,
// driveway, paving_paths, fences, retaining_walls, internal_areas and
// notes templates, ported from the Houspect "Building (Pre-Purchase)
// Inspector template_HOUSE and Commercial" (26 March 2025) -- the source
// document explicitly shares one body of content across both property
// types (only the top intake block distinguishes "Residential" vs
// "Commercial" construction type), so this script publishes the identical
// content to both lineages. Every other (inspectionType, propertyType)
// lineage is untouched; uses the existing versioning flow (archive prior
// published row, publish the new one).
import { prisma } from '../lib/prisma';
import { TemplateField, TemplateFieldOption } from '../modules/templates/templates.schemas';

const INSPECTION_TYPE = 'pre_purchase';
const PROPERTY_TYPES = ['residential_house', 'commercial_properties'];

function numbered(fields: Omit<TemplateField, 'order'>[]): TemplateField[] {
  return fields.map((f, i) => ({
    ...f,
    order: i,
    itemFields: f.itemFields ? numbered(f.itemFields as Omit<TemplateField, 'order'>[]) : undefined,
  }));
}

const opt = (value: string, label: string): TemplateFieldOption => ({ value, label });
const items = (labels: string[]): TemplateFieldOption[] => labels.map((l, i) => opt(`item${i}`, l));
const YES_NO: TemplateFieldOption[] = [opt('yes', 'Yes'), opt('no', 'No')];
const yesno = (key: string, label: string) => ({ key, label, type: 'yesno' as const, options: YES_NO });
const chips = (key: string, label: string, options: string[]) => ({ key, label, type: 'pill-select' as const, options: items(options) });
const text = (key: string, label: string) => ({ key, label, type: 'text' as const });
const CONDITION = ['Good', 'Satisfactory', 'Fair', 'Average', 'Poor', 'Varying'];

/** One inspection sub-area: optional Applicability gate, fields, curated observation checklists, comments, photos. */
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
      key: `${prefix}_applicability`, label: 'Applicability', type: 'pill-select',
      options: [opt('applicable', 'Assessed'), ...naOptions!.map((o) => opt(o.value, o.label))],
      sectionLetter: group,
    });
  }
  const gate = hasNA ? { fieldKey: `${prefix}_applicability`, equals: 'applicable' } : undefined;

  for (const f of fields) out.push({ ...f, key: `${prefix}_${f.key}`, sectionLetter: group, gate });
  checkGroups.forEach((g, i) => {
    out.push({ key: `${prefix}_checks${i}`, label: g.heading ?? 'Observations', type: 'chip-multiselect', allowOther: true, options: items(g.options), sectionLetter: group, gate });
  });
  out.push({ key: `${prefix}_comments`, label: 'Comments', type: 'textarea', maxLength: 500, sectionLetter: group, gate });
  if (photos) out.push({ key: `${prefix}_photos`, label: 'Photos', type: 'photos', sectionLetter: group, gate });
  return out;
}

// ── Roof & chimneys (roof_chimneys) ─────────────────────────────────
const ROOF_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'roofcov', group: 'Roof Covering',
    fields: [
      chips('roofShape', 'The roof is', ['Pitched', 'Flat', 'Combination of pitched and flat', 'Other']),
      chips('covering', 'Covering and capping/ridges', ['Concrete tiles', 'Terracotta tiles', 'Colorbond', 'Zincalume', 'Other']),
      chips('condition', 'Condition', [...CONDITION, 'Good in relation to its age']),
      chips('requires', 'Generally requires', ['No repairs', 'Normal maintenance', 're-pointing']),
    ],
    checkGroups: [{ options: ['Minimal fall to metal roof sheeting less than recommended pitch – overflows may occur during heavy rains', 'Rusted roof needs replacing', 'Broken tiles were observed', 'Cement tiles have lost their protective coating and require recoating in 1 to 2 years / 3 to 5 years'] }],
  }),
  ...subArea({
    prefix: 'eaves', group: 'Eaves / Soffits',
    naOptions: [{ value: 'na', label: 'There are no eaves nor soffits' }],
    fields: [chips('material', 'Eaves / soffits are', ['Boxed with painted fibre cement', 'Painted timber lining boards', 'Lined on the rake and exposed rafters', 'Exposed rafters', 'Other']), chips('condition', 'Condition', CONDITION), chips('requires', 'Require', ['Maintenance', 'Repairs', 'No attention'])],
    checkGroups: [{ options: ['Water stains indicating regularly overflowing gutters', 'Linings are bowed', 'Linings are cracked'] }],
  }),
  ...subArea({
    prefix: 'fascia', group: 'Fascia',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('material', 'Constructed of', ['Timber', 'Colorbond steel', 'Timber and rolled sheet metal']), chips('finish', 'They are', ['Painted', 'Unpainted', 'Weathered']), chips('condition', 'Condition', CONDITION), yesno('requiresAttention', 'They require attention')],
    checkGroups: [{ options: ['Timber is weathered requiring maintenance', 'Timber is decayed requiring maintenance', 'Metal is rusted requiring maintenance'] }],
  }),
  ...subArea({
    prefix: 'gables', group: 'Gables',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [text('material', 'Gables are constructed of'), yesno('painted', 'Painted'), chips('condition', 'Condition', CONDITION)],
    checkGroups: [{ options: ['Timber is weathered requiring maintenance', 'Timber is decayed requiring maintenance', 'Brickwork is cracking – refer to Walls section', 'Cement sheet is cracked/damaged'] }],
  }),
  ...subArea({
    prefix: 'flashings', group: 'Flashings',
    naOptions: [{ value: 'na', label: 'Not visible / roof not accessible' }],
    fields: [chips('material', 'Flashings are constructed of', ['Colorbond', 'Sheet metal', 'Lead and sheet metal', 'Lead']), yesno('painted', 'Painted'), chips('condition', 'Condition', CONDITION)],
    checkGroups: [{ options: ['Gaps seen between walls and flashing requires sealant', 'The lead flashings need to be painted', 'The chimney flashings are rusted and need to be replaced'] }],
  }),
  ...subArea({
    prefix: 'guttersvalleys', group: 'Gutters & Valleys',
    naOptions: [{ value: 'na', label: 'Roof could not be safely accessed' }],
    fields: [
      chips('gutterType', 'There are', ['Perimeter gutters', 'Boxed gutters', 'Both']),
      chips('material', 'Gutters are constructed of', ['Colorbond', 'Zincalume', 'Other']),
      chips('condition', 'Condition in relation to their age is', CONDITION),
      chips('requires', 'Require', ['Repair', 'Replacement', 'Normal maintenance', 'No attention']),
      chips('valleys', 'Valleys', ['There are no valleys', 'Galvanised iron', 'Zincalume', 'Colorbond steel']),
      chips('valleysCondition', 'Valleys general condition', CONDITION),
    ],
    checkGroups: [{ options: ['Gutters are holding water and have inadequate falls to downpipes – consult a licensed plumber', 'Gutters are rusting and require maintenance or replacement – consult a licensed plumber', 'Evidence of overflowing gutters – engage a licensed plumber to assess and rectify', 'Gutters require replacement to several sections – engage a licensed plumber', 'The valley irons are rusted and need maintenance / to be replaced'] }],
  }),
  ...subArea({
    prefix: 'downpipes', group: 'Downpipes',
    fields: [chips('material', 'Fabricated of', ['Colorbond', 'Zincalume', 'PVC', 'Other']), chips('condition', 'Condition', CONDITION), chips('requires', 'They require', ['Repairs', 'Replacement', 'Maintenance on the joints', 'Normal maintenance', 'No attention'])],
    checkGroups: [{ options: ['The downpipes are leaking – engage a licensed plumber to assess and rectify', 'The downpipes are rusted requiring repair / replacement – engage a licensed plumber to assess and rectify'] }],
  }),
  ...subArea({
    prefix: 'chimneys', group: 'Chimneys / Flue',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('type', 'Chimney is', ['Metal flue and okay', 'Brick', 'Rendered brick', 'Bluestone']), chips('condition', 'Condition is', ['Weathered', 'Satisfactory', 'Unsafe structurally', 'Poor']), yesno('operating', 'Operating at time of inspection')],
    checkGroups: [{ options: ['Consult a plumber', 'Brick work is fretting and needs repointing'] }],
  }),
];

// ── External (elevations) ──────────────────────────────────────────
const EXTERNAL_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'extwalls', group: 'External Walls',
    fields: [
      text('material', 'External walls constructed of'), yesno('rendered', 'Rendered'),
      chips('condition', 'Condition in relation to their age is', ['Satisfactory', 'Fair', 'Average', 'Poor', 'Average to poor']),
      yesno('majorCracking', 'Signs of major cracking'), yesno('sigWeathering', 'Signs of significant weathering'), yesno('generallyStable', 'Walls are generally stable'),
    ],
    checkGroups: [
      { heading: 'Cracking assessment', options: ['Minor cracking visible consistent with age – not of a structural nature', 'Cracking over window/door heads is typical and not considered a structural defect unless bricks are loose', 'Major cracking requiring repairs – currently not affecting the structure, but could if not attended to soon', 'Immediate repairs required to arrest movement and collapse – consider consulting a structural engineer'] },
      { heading: 'Defect items', options: ['Loose bricks', 'Drummy render', 'Fretting of mortar requires repointing', 'Evidence of rising damp', 'Patching and re-pointing to brickwork where appliances/fittings have been removed', 'Mortar has come out of joints at lower courses and needs repointing', 'Spalling to some bricks', 'Weep holes not visible', 'Weep holes covered or partly covered and need to be kept clear', 'Sub floor vents covered or partly covered and need to be kept clear'] },
    ],
  }),
  ...subArea({
    prefix: 'cladding', group: 'Cladding',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [
      text('material', 'Cladding constructed of'), yesno('rendered', 'Rendered'),
      chips('condition', 'Condition in relation to age is', ['Satisfactory', 'Fair', 'Average', 'Poor', 'Average to poor']),
      yesno('sigWeathering', 'Signs of significant weathering'), chips('requires', 'Cladding requires', ['Normal maintenance', 'Completion of render', 'Re-painting', 'Maintenance or replacement']),
    ],
    checkGroups: [{ options: ['Breakage visible to cement sheet wall cladding', 'Cladding may contain asbestos'] }],
  }),
  ...subArea({
    prefix: 'subfloor', group: 'Sub-Floor',
    naOptions: [{ value: 'na-slab', label: 'Not applicable – constructed on concrete slab' }, { value: 'na-access', label: 'No access to subfloor' }],
    fields: [
      chips('accessedFrom', 'Sub-floor inspected from manhole at', ['Side', 'Rear', 'Other access']),
      chips('viewsThrough', 'Limited views through plinth boards — condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor structurally']),
      yesno('adequateSupport', 'It provides adequate support'),
    ],
    checkGroups: [{ options: ['Stumps have subsided', 'There is some decay to several stumps', 'Requires re-stumping', 'Packing required to stumps/bearers', 'The sub-floor is damp due to poor ventilation/drainage', 'Stored items and debris to be cleared from sub floor to improve access and airflow', 'Floors are bouncy/squeaking due to movement as there appears to be some subsidence'] }],
  }),
  ...subArea({
    prefix: 'lintels', group: 'Lintels',
    fields: [chips('material', 'Constructed of', ['Steel', 'Concrete', 'Limestone', 'Timber']), chips('condition', 'Condition', ['Satisfactory', 'Fair', 'Average', 'Poor']), chips('signsOfFailure', 'Any signs of failure', ['No and okay', 'No obvious signs', 'Some minor', 'Some major', 'Yes failing & need repairs'])],
    checkGroups: [{ options: ['The lintel/s require/s replacement and the brick work above should be repaired', 'Severe rusting is causing the lintel to expand and crack the surrounding brickwork', 'Surface rust and needs maintenance'] }],
  }),
  ...subArea({
    prefix: 'windowsext', group: 'Windows / Window Frames',
    fields: [
      chips('material', 'Windows and frames are generally constructed of', ['Timber and aluminium', 'Timber', 'Aluminium', 'Timber and powder-coated', 'Anodized', 'Painted']),
      chips('condition', 'Condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']),
      chips('requires', 'Require', ['Normal maintenance', 'Repairs', 'No attention']),
      chips('glazingBeads', 'Glazing beads appear', ['Sound', 'Serviceable', 'Poor']),
      yesno('securityScreens', 'Security screens installed'), yesno('rollerShutters', 'Roller shutters installed'),
    ],
    checkGroups: [{ options: ['Broken glazed pane', 'The aluminium frame edge has come away from the rubber seal and glazing', 'Water ingress visible to glazing frame requires replacement of putty and sealing', 'Weathering surface damage to timber frames, requires painting', 'Some wood decay requiring attention', 'If non-timber windows, confirm "Glazing beads" is to be replaced by "Neoprene glazing rubber"'] }],
  }),
  ...subArea({
    prefix: 'frontdoor', group: 'Front Door(s) & Frames',
    fields: [chips('material', 'Constructed of', ['Timber', 'Aluminium', 'Pressed metal', 'Other']), chips('condition', 'Condition', CONDITION), chips('requires', 'Require', ['No repairs', 'Normal maintenance', 'Re-painting']), yesno('secScreen', 'Front door security screen'), yesno('deadlocks', 'Deadlocks fitted'), chips('doorCloser', 'Door closer working', ['NA', 'Yes', 'No'])],
  }),
  ...subArea({
    prefix: 'otherdoors', group: 'Other External Doors',
    fields: [chips('style', 'Doors are', ['Solid-core', 'Hollow-core', 'Glazed', 'Paneled', 'Aluminium sliding', 'Variety of styles']), chips('condition', 'Condition generally', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']), chips('requires', 'Generally require', ['No repairs', 'Normal maintenance', 'Re-painting'])],
    checkGroups: [{ options: ['Doors are delaminating', 'Doors are binding – require 2mm clearance', 'Edges of door require sealing to avoid water damage', 'Door latch not engaging'] }],
  }),
  ...subArea({
    prefix: 'extstairs', group: 'External Stairs',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('material', 'Constructed of', ['Brick', 'Steel', 'Timber', 'Concrete', 'Other']), chips('condition', 'Condition', CONDITION), chips('handrails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no']), yesno('riseTreadAdequate', 'The rise and tread are adequate')],
    checkGroups: [{ heading: 'Compliance', options: ['The handrails/balustrade height is less than 1000mm and does not comply with Australian Standards', 'The balustrade spacing between railings is more than 125mm and does not comply with Australian Standards', 'Stair treads / risers are not equal and do not comply with current Australian Standards', 'Stair risers are higher than the maximum 190mm and do not comply with current Australian Standards', 'Stair treads are less than the minimum 240mm and do not comply with current Australian Standards'] }],
  }),
  ...subArea({
    prefix: 'balconies', group: 'Balconies',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('material', 'Constructed of', ['Steel', 'Timber', 'Concrete', 'Other']), chips('condition', 'Condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']), yesno('adequatelyFixed', 'Appear adequately fixed to building'), chips('handRails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no']), chips('handRailCond', 'Condition of hand rails', CONDITION)],
    checkGroups: [{ heading: 'Handrail / balustrade defects', options: ['There is decay to hand rails', 'Hand rails do not comply with current Australian Standards', 'The balustrade is loose and requires maintenance', 'The handrails/balustrade height is less than 1000mm and does not comply with Australian Standards', 'The balustrade spacing between railings is more than 125mm and does not comply with Australian Standards', 'Water appears to pond on the balcony floor – the floor falls may not be channelling water to the drain', 'The balcony floor drainage may be blocked – recommend all drains be cleaned out as part of maintenance'] }],
  }),
  ...subArea({
    prefix: 'verandah', group: 'Verandah / Front Porch / Decking',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('material', 'Constructed of', ['Steel', 'Timber', 'Concrete', 'Other']), chips('condition', 'Condition', ['Varying', 'Satisfactory', 'Fair', 'Average', 'Poor']), yesno('adequatelyFixed', 'Appears adequately fixed to the building'), chips('handRails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no']), chips('handRailCond', 'Condition of hand rails', CONDITION)],
    checkGroups: [{ options: ['There is decay to hand rails', 'The handrails/balustrade height is less than 1000mm and does not comply with Australian Standards', 'The balustrade spacing between railings is more than 125mm and does not comply with Australian Standards'] }],
  }),
  ...subArea({
    prefix: 'alfresco', group: 'Alfresco / Pergola',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [text('material', 'Alfresco / pergola is constructed of'), yesno('freestanding', 'Freestanding'), yesno('adequatelyFixed', 'Adequately fixed to the house'), yesno('covered', 'It is covered'), chips('coveringType', 'The covering is', ['Colorbond', 'Laserlite', 'Other']), yesno('adequatelySupported', 'Adequately supported')],
    checkGroups: [{ options: ['Signs of rust to metal stirrups require maintenance', 'Exposed timber requires maintenance', 'There is decay', 'Weathering to timber battens, requiring replacement', 'Rafter bolts required to fix the support to the house', 'Signs of sagging and movement'] }],
  }),
];

// ── Pool / Spa (pool_spa) ──────────────────────────────────────────
const POOL_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'pool', group: 'Pool / Spa',
  naOptions: [{ value: 'na', label: 'Not applicable' }],
  fields: [
    chips('type', 'There is a', ['Pool', 'Spa']),
    chips('material', 'Constructed of', ['Concrete', 'Fibreglass', 'Vinyl']),
    chips('installation', 'It is', ['Above ground', 'In ground', 'Recessed into timber deck']),
    yesno('signsOfSubsidence', 'There are signs of subsidence'),
    yesno('fencingAdequate', 'The pool / spa fencing appears to be adequate'),
  ],
  checkGroups: [{ options: ['The pool is not adequately fenced from the house', 'The pool fence height is compromised in places', 'The house windows/doors are not self-latching and do not appear to meet pool regulations', 'Windows open more than 100mm requiring a permanent restriction', 'Pool gate/s are not self-latching and do not appear to meet pool regulations'] }],
});

// ── Structures (garage_carport_sheds): Sheds, Garage, Carport, Studio, Granny Flat ──
const STRUCTURE_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'sheds', group: 'Sheds',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('count', 'Count', ['1', '2', '3']), text('material', 'Constructed of'), chips('condition', 'Condition', CONDITION), yesno('requiresAttention', 'Requires attention')],
  }),
  ...subArea({
    prefix: 'garage', group: 'Garage',
    naOptions: [{ value: 'na', label: 'There is no garage' }],
    fields: [
      chips('location', 'Location', ['Garage in basement', 'Car bay in basement of apartment complex', 'Freestanding', 'Attached to house — front', 'Attached to house — left side', 'Attached to house — rear', 'Attached to house — right side']),
      chips('walls', 'Walls constructed of', ['Brick', 'Metal sheets', 'Fibre cement sheets', 'Concrete slab hardstand']),
      chips('roofCovering', 'Roof covering', ['Colorbond', 'Other']),
      chips('condition', 'General condition', CONDITION),
      yesno('requiresAttention', 'Requires attention'),
    ],
    checkGroups: [{ options: ['Cracking to walls', 'Repairs required', 'Damp visible to walls', 'Roof is leaking – replace roof / consult plumber', 'Rust to lintels', 'Minor cracking to hardstand but not of concern – monitor from time to time', 'There is decay'] }],
  }),
  ...subArea({
    prefix: 'carport', group: 'Carport',
    naOptions: [{ value: 'na', label: 'There is no carport' }],
    fields: [chips('location', 'Carport is at', ['Front', 'Left side', 'Rear', 'Right side']), chips('attachedTo', 'Attached to', ['Garage', 'House']), text('frame', 'Frame/support constructed of'), chips('roofCovering', 'Roof covering', ['Colorbond', 'Other']), chips('condition', 'General condition', CONDITION)],
    checkGroups: [{ options: ['Roof is leaking – replace roof / consult plumber', 'There is decay'] }],
  }),
  ...subArea({
    prefix: 'studio', group: 'Studio',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('location', 'Located at', ['Above garage', 'Attached to house', 'Freestanding']), chips('condition', 'General condition', CONDITION), yesno('requiresAttention', 'Requires attention')],
  }),
  ...subArea({
    prefix: 'grannyflat', group: 'Granny Flat',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [text('location', 'Located at'), text('material', 'Constructed of'), text('roofCovering', 'Roof covering is'), chips('condition', 'General condition', CONDITION), yesno('requiresAttention', 'Requires attention')],
  }),
];

// ── Driveway (driveway), External Paving (paving_paths), Fences (fences), Retaining Walls (retaining_walls) ──
const DRIVEWAY_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'pp_driveway', group: 'Driveway',
  naOptions: [{ value: 'na', label: 'Not applicable' }],
  fields: [text('material', 'Driveway constructed of')],
  checkGroups: [{ options: ['Minor cracking', 'Typical wear and tear', 'Major cracking or subsidence that may cause a tripping hazard – add to Safety matters'] }],
});

const PAVING_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'pp_paving', group: 'External Paving',
  naOptions: [{ value: 'na', label: 'Not applicable' }],
  fields: [text('material', 'Paving constructed of')],
  checkGroups: [{ options: ['Minor cracking', 'Typical wear and tear', 'Significant cracking or subsidence that may cause a tripping hazard – add to Safety matters', 'Excessive settlement requiring lifting, levelling, and re-laying'] }],
});

const FENCES_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'pp_fences', group: 'Fences',
  naOptions: [{ value: 'na', label: 'Not applicable' }],
  fields: [chips('material', 'Constructed of', ['Brick', 'Pickets', 'Timber palings', 'Colourbond sheets', 'Combo of']), chips('condition', 'Condition', CONDITION), chips('requires', 'Require', ['Repairs', 'Normal maintenance'])],
  checkGroups: [{ options: ['Timbers are loose requiring attention', 'Timbers are broken/decayed requiring replacement', 'Broken panels', 'Fencing is leaning', 'Fence is leaning due to a build-up of soil on one side', 'Brickwork fences cracking', 'Unstable and may be structurally unsound'] }],
});

const RETAINING_WALLS_FIELDS: Omit<TemplateField, 'order'>[] = subArea({
  prefix: 'pp_retaining', group: 'Retaining Walls',
  naOptions: [{ value: 'na', label: 'Not applicable' }],
  fields: [text('material', 'Constructed of'), yesno('signsOfMajorCracking', 'There are signs of major cracking')],
  checkGroups: [{ options: ['Minor cracking not of a structural nature', "Wall/s not coping with the loads", 'Cracking requires attention', 'Cracking needs to be investigated by a structural engineer', 'Wood decay needs attention'] }],
});

// ── Roof cavity / frame / insulation, folded into roof_chimneys ─────
const ROOF_CAVITY_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'roofcavity', group: 'Roof Cavity',
    naOptions: [{ value: 'na-flat', label: 'Flat roof design with no cavity' }, { value: 'na-manhole', label: 'No manhole' }, { value: 'na-access', label: 'No safe access to manhole' }],
    fields: [chips('condition', 'Condition of roof covering underside', CONDITION), yesno('failureIndications', 'Indications of failure of roof covering')],
    checkGroups: [{ options: ['Evidence of staining', 'Evidence of efflorescence (salting)', 'Build-up of salt deposits under tiles indicates breakdown of protective coating – resealing may be required', 'Underside of tiles are fretting', 'The metal roofing has pinholes due to rusting', 'Re-coating of roof tiles may need to be considered in the next 1 to 2 years / 3 to 5 years'] }],
  }),
  ...subArea({
    prefix: 'sarking', group: 'Sarking',
    naOptions: [{ value: 'na-access', label: 'No access to roof cavity' }, { value: 'na-none', label: 'Not applicable – there is no sarking' }],
    fields: [yesno('effective', 'Sarking is in place and is considered effective')],
  }),
  ...subArea({
    prefix: 'roofframe', group: 'Roof Frame',
    naOptions: [{ value: 'na', label: 'No access' }],
    fields: [chips('constructedOf', 'Roof frame is constructed of', ['Timber', 'Steel']), chips('frameType', 'Frame is', ['Conventional stick frame', 'Truss', 'Engineered steel girders', 'Structural steel frame', 'Combination of conventional stick frame and truss', 'Exposed rafters beams']), yesno('supportAdequate', 'The support system is adequate')],
    checkGroups: [{ options: ['A frame member is broken requiring repair', 'The supporting timbers are over-spanned', 'The supporting timbers are undersized', 'The rafters / tile batons have warped but are still structurally sound', 'The metal roof is not adequately held down – tie down straps are required as per the Building Code of Australia', 'Roof frame is considered not structurally sound (major defects)'] }],
  }),
  ...subArea({
    prefix: 'insulation', group: 'Insulation',
    naOptions: [{ value: 'na', label: 'No access to roof cavity' }],
    fields: [chips('visibility', 'Insulation is', ['Partially visible', 'Not visible', 'In place']), yesno('effective', 'Effective')],
    checkGroups: [{ options: ['Some insulation is not in place and needs to be re-positioned to be more effective', 'Old insulation may not be effective and needs top up or new insulation batts installed', 'Safety matter: insulation touching and covering the recessed light fittings and transformers – this is a fire hazard and should be moved or housed in a suitable fire-resistant enclosure'] }],
  }),
];

// ── Internal building systems (internal_areas, appended after "rooms") ──
const INTERNAL_SYSTEM_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({
    prefix: 'partywalls', group: 'Party Walls',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [text('location', 'Party wall(s) location'), yesno('extendsToRoof', 'Party wall extends to underside of roof cover'), yesno('fireBarrier', 'Appropriately constructed as fire barrier')],
    checkGroups: [{ options: ['Roof timbers passing through party wall – brickwork does not go to underside of roof covering'] }],
  }),
  ...subArea({
    prefix: 'ceilings', group: 'Ceilings',
    fields: [chips('material', 'Ceiling material is generally made of', ['Plasterboard', 'Lathe and plaster', 'Other']), chips('cornices', 'Cornices are', ['Cove', 'Ornate', 'Traditional', 'Varying', 'Timber moulding', 'Shadowline', 'Square set']), chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying']), yesno('adequatelyFixed', 'Adequately fixed')],
    checkGroups: [{ options: ['Ceiling not adequately attached to ceiling frame and has deflected significantly', 'Minor imperfections i.e. hairline cracks consistent with age and not considered a significant defect', 'Cornice cracking due to contraction and expansion of supporting timbers and is not a structural issue', 'Presence of flaking / mould / mildew to paintwork due to excessive moisture in wet areas – mechanical ventilation should be installed', 'Minor paint flaking', 'Watermarks and staining visible due to a water leak'] }],
  }),
  ...subArea({
    prefix: 'walls', group: 'Walls',
    fields: [chips('material', 'Constructed of', ['Plasterboard on timber studs', 'Lathe and plaster', 'Plasterboard on brick walls', 'Concrete']), chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying'])],
    checkGroups: [{ options: ['There is no major cracking nor other signs of significant movement', 'Minor cracking over doorways and/or windows consistent with age and not a structural concern', 'Minor cracking consistent with age, due to normal settlement/movement', 'There is major cracking requiring attention', 'Structural cracks requiring investigation by a structural engineer', 'Drummy/loose/flaking plaster', 'Walls have been recently painted', 'Damp from shower/bath in adjacent room to the base of the wall'] }],
  }),
  ...subArea({
    prefix: 'floors', group: 'Floors',
    fields: [chips('material', 'Generally constructed of', ['Concrete and timber', 'Polished concrete', 'Timber floorboards', 'Other']), chips('coverings', 'Covered in', ['Floating timber', 'Tiles', 'Laminate flooring', 'Vinyl', 'Carpet'])],
    checkGroups: [{ options: ['The tiled areas do not require attention', 'No significant cracks were seen', 'Floor tiling drummy', 'Concrete floor has minor cracking caused by rate of drying and is not of a structural nature', 'Timber floors are squeaking and require refixing', 'Floors unlevel — packing to stumps/bearers may be required', 'Flooring is poorly supported', 'Subsidence of the floor evident'] }],
  }),
  ...subArea({
    prefix: 'intstairs', group: 'Internal Stairs',
    naOptions: [{ value: 'na', label: 'The property is single level – no internal stairs' }],
    fields: [chips('material', 'Constructed of', ['Steel', 'Concrete', 'Timber', 'Other']), chips('condition', 'Condition', CONDITION), chips('handrails', 'Hand rails', ['Not required', 'Adequate – yes', 'Adequate – no'])],
    checkGroups: [{ heading: 'Compliance & safety', options: ['The handrails/balustrade height is less than 1000mm and does not comply with Australian Standards', 'The balustrade spacing between railings is more than 125mm and does not comply with Australian Standards', 'The balustrade has horizontal rails that may be climbable by a child and is a safety concern – add to safety matters', 'Stair treads / risers are not equal and do not comply with current Australian Standards', 'Stair risers are higher than the maximum 190mm and do not comply with current Australian Standards', 'Stair treads are less than the minimum 240mm and do not comply with current Australian Standards'] }],
  }),
  ...subArea({
    prefix: 'intwindows', group: 'Windows (Internal)',
    fields: [chips('condition', 'Internal condition', CONDITION), yesno('locksGeneral', 'Locks are generally fitted'), chips('flywire', 'Flywire screens fitted to', ['Some windows', 'Most windows', 'All windows', 'None']), chips('flywireCondition', 'Flywire condition', CONDITION)],
    checkGroups: [{ options: ['Windows are difficult to open and need servicing and maintenance', 'At upper windows, restrictors need to be fitted to maximum opening of 125mm – safety concern', 'Windows were locked and could not be opened to check operation'] }],
  }),
  ...subArea({
    prefix: 'intdoors', group: 'Internal Doors',
    fields: [chips('style', 'Generally', ['Panelled', 'Flush style', 'Several styles']), chips('condition', 'Condition', ['Good', 'Satisfactory', 'Average', 'Poor', 'Varying'])],
    checkGroups: [{ options: ['Doors are binding and need maintenance', 'Door furniture is loose / not latching'] }],
  }),
  ...subArea({
    prefix: 'cabinets', group: 'Cabinets',
    fields: [chips('condition', 'General condition', ['Good', 'Satisfactory', 'Fair', 'Average', 'Poor', 'Consistent with age'])],
    checkGroups: [{ options: ['Cabinet drawers are binding and need adjustment', 'Cabinet / robe doors are binding and need adjustment', 'Cabinet / robe doors do not close properly and need adjustment', 'There is water damage / swelling to cabinet'] }],
  }),
  ...subArea({
    prefix: 'plumbing', group: 'Plumbing', photos: false,
    fields: [yesno('waterSupplyOn', 'Water supply on'), yesno('tapsNormal', 'All taps, showers, toilets operated normally'), yesno('waterHammer', 'Water hammer present'), yesno('drainsNormal', 'All sinks, vanities and showers drained normally'), yesno('waterLeaks', 'Water leaks to taps / waste pipes / showers')],
  }),
  ...subArea({
    prefix: 'gas', group: 'Gas', photos: false,
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('supplyType', 'Gas supply is', ['Mains', 'LPG (cylinders)']), yesno('gasSupplyOn', 'Gas supply on'), yesno('detectedLeaks', 'Detectable leaks'), yesno('appliancesOperated', 'Appliances operated correctly')],
    checkGroups: [{ options: ['Consult a licensed gas fitter', 'Add to safety matters'] }],
  }),
  ...subArea({
    prefix: 'electrical', group: 'Electrical', photos: false,
    fields: [
      yesno('powerOn', 'Power supply on'), yesno('appliancesOperated', 'Lights, fans, appliances operated correctly'),
      chips('rcdCount', 'Number of RCDs', ['Nil', '1', '2', '3', '4', '5', 'Other']),
      yesno('batteryAlarms', 'Battery smoke alarms installed'), chips('batteryAlarmsCount', 'Battery smoke alarm count', ['1', '2', '3', 'Other']),
      yesno('hardwiredAlarms', 'Hardwired smoke alarms installed'), chips('hardwiredCount', 'Hardwired smoke alarm count', ['1', '2', '3', 'Other']),
      yesno('alarmsLocated', 'Smoke alarms located within 1.5 metres of each sleeping area'),
    ],
    checkGroups: [{ options: ['If nil RCDs, add to safety matters', 'If smoke alarms not correctly located, refer to safety matters'] }],
  }),
  ...subArea({
    prefix: 'fireplace', group: 'Fireplace / Heater Insert',
    naOptions: [{ value: 'na', label: 'Not applicable' }],
    fields: [chips('type', 'Type', ['Gas heater inserted', 'Electric heater inserted']), chips('count', 'Count', ['1', '2', '3']), yesno('operating', 'Operating at time of inspection')],
    checkGroups: [{ options: ['Requires normal maintenance', 'Recommend urgent servicing'] }],
  }),
];

// ── Structural & Safety (notes) ──────────────────────────────────────
const STRUCTURAL_SAFETY_FIELDS: Omit<TemplateField, 'order'>[] = [
  ...subArea({ prefix: 'structural', group: 'Structural Defects', photos: false, fields: [yesno('structurallySound', 'The property is considered structurally sound')] }),
  ...subArea({ prefix: 'majordefects', group: 'Major Defects', photos: false, fields: [yesno('freeOfMajorDefects', 'In relation to its age, is the property free of major defects')] }),
  ...subArea({
    prefix: 'safety', group: 'Safety Matters',
    fields: [yesno('safetyMatters', 'Are there safety matters evident')],
    checkGroups: [{ heading: 'Safety items', options: ['Smoke alarms not installed in required locations per AS 3.7.2.3', 'Insulation touching/covering recessed light fittings and transformers – fire hazard', 'There is fibre cement sheeting that may contain asbestos (used in construction between 1930s to mid-1980s)', 'Refer to pool concerns', 'Refer to stairs concerns', 'Refer to trip hazard concerns'] }],
  }),
];

async function publishOverlay(propertyType: string, sectionKey: string, buildFields: (existing: TemplateField[]) => TemplateField[]) {
  const published = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType, sectionKey, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  const latest = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType, sectionKey },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('no ADMIN user found');

  const existingFields = ((published?.fields as unknown as TemplateField[]) ?? []) as TemplateField[];
  const nextFields = numbered(buildFields(existingFields) as Omit<TemplateField, 'order'>[]);

  const draft = await prisma.inspectionTemplate.create({
    data: {
      inspectionType: INSPECTION_TYPE, propertyType, sectionKey,
      name: published?.name ?? sectionKey,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: nextFields as unknown as object,
      createdById: admin.id,
    },
  });

  await prisma.$transaction([
    prisma.inspectionTemplate.updateMany({ where: { inspectionType: INSPECTION_TYPE, propertyType, sectionKey, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } }),
    prisma.inspectionTemplate.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`[prepurchase-house-commercial] published ${propertyType}/${sectionKey} v${draft.version} (${nextFields.length} fields)`);
}

async function main() {
  for (const propertyType of PROPERTY_TYPES) {
    await publishOverlay(propertyType, 'job-info', (existing) => [
      ...existing,
      yesno('occupied', 'Occupied?') as TemplateField,
      yesno('agentOnSite', 'Agent on site?') as TemplateField,
      yesno('clientOnSite', 'Client on site?') as TemplateField,
      yesno('safetyIssues', 'Safety issues?') as TemplateField,
      { key: 'safetyIssuesDescribe', label: 'Describe safety issues', type: 'textarea', maxLength: 500 } as TemplateField,
      chips('clientListOfIssues', 'Client list of issues', ['Yes', 'N/A']) as TemplateField,
      yesno('additionsExtensions', 'Additions / extensions?') as TemplateField,
      { key: 'additionsExtensionsAt', label: 'Additions built (year/decade) at (rear/side/first floor/...)', type: 'text' } as TemplateField,
      chips('blockSlope', 'The block is', ['Steep sloping', 'Gently sloping', 'Mostly flat']) as TemplateField,
    ]);

    await publishOverlay(propertyType, 'roof_chimneys', () => [...(ROOF_FIELDS as TemplateField[]), ...(ROOF_CAVITY_FIELDS as TemplateField[])]);

    await publishOverlay(propertyType, 'elevations', (existing) => [...existing, ...(EXTERNAL_FIELDS as TemplateField[])]);

    await publishOverlay(propertyType, 'pool_spa', () => POOL_FIELDS as TemplateField[]);

    await publishOverlay(propertyType, 'garage_carport_sheds', () => STRUCTURE_FIELDS as TemplateField[]);

    await publishOverlay(propertyType, 'driveway', () => DRIVEWAY_FIELDS as TemplateField[]);
    await publishOverlay(propertyType, 'paving_paths', () => PAVING_FIELDS as TemplateField[]);
    await publishOverlay(propertyType, 'fences', () => FENCES_FIELDS as TemplateField[]);
    await publishOverlay(propertyType, 'retaining_walls', () => RETAINING_WALLS_FIELDS as TemplateField[]);

    await publishOverlay(propertyType, 'internal_areas', (existing) => [...existing, ...(INTERNAL_SYSTEM_FIELDS as TemplateField[])]);

    await publishOverlay(propertyType, 'notes', (existing) => [...(STRUCTURAL_SAFETY_FIELDS as TemplateField[]), ...existing]);
  }

  await prisma.$disconnect();
}

void main();
