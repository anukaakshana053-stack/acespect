// One-off content patch: publishes a v3 for the Dilapidation + Public Assets
// profile's elevations template, closing a gap found when auditing the
// content against the source PDF ("Dilapidation PUBLIC ASSETS Type 1 -
// Inspector template"): the PDF says that if Guard Rails / Retaining Walls /
// Bridges (within Road Surface & Parking Bays) are marked "Yes", the
// inspector should "add a page with tables and details/pics" for that item
// -- but the existing template only had a bare Yes/No toggle with one
// shared "Other" text box, no dedicated damage capture. This adds a gated
// damage-list + photos field for each of the three, appearing only when
// that item is marked Yes, matching the same damage-list shape used
// throughout the rest of this template. Only this one section/profile is
// touched; uses the existing versioning flow (archive prior published row,
// publish the new one).
import { prisma } from '../lib/prisma';
import { TemplateField, TemplateFieldOption } from '../modules/templates/templates.schemas';

const INSPECTION_TYPE = 'dilapidation';
const PROPERTY_TYPE = 'public_assets';
const SECTION_KEY = 'elevations';

function numbered(fields: Omit<TemplateField, 'order'>[]): TemplateField[] {
  return fields.map((f, i) => ({
    ...f,
    order: i,
    itemFields: f.itemFields ? numbered(f.itemFields as Omit<TemplateField, 'order'>[]) : undefined,
  }));
}

const opt = (value: string, label: string): TemplateFieldOption => ({ value, label });
const items = (labels: string[]): TemplateFieldOption[] => labels.map((l, i) => opt(`item${i}`, l));

function damageFollowUp(key: string, label: string, gateOn: string, group: string): Omit<TemplateField, 'order'>[] {
  const gate = { fieldKey: gateOn, equals: 'yes' };
  return [
    {
      key: `${key}Damages`, label: `${label} — details`, type: 'damage-list', sectionLetter: group, gate,
      itemFields: numbered([
        { key: 'location', label: 'Location / position', type: 'text' },
        { key: 'damageType', label: 'Crack / gap / other', type: 'pill-select', options: items(['Crack', 'Subsidence', 'Gap', 'Chipping', 'Rust', 'Leaning']) },
        { key: 'startDirection', label: 'Start point & direction', type: 'text' },
        { key: 'widthMm', label: 'Width', type: 'numeric', unit: 'mm' },
        { key: 'lengthMm', label: 'Length', type: 'numeric', unit: 'mm' },
        { key: 'photos', label: 'Photos', type: 'photos' },
      ]),
    },
    { key: `${key}Photos`, label: `${label} — wide photos`, type: 'photos', sectionLetter: group, gate },
  ];
}

async function main() {
  const published = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!published) throw new Error('No published elevations template found for dilapidation/public_assets');

  const latest = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('no ADMIN user found');

  const fields = published.fields as unknown as TemplateField[];
  const parts = fields.find((f) => f.key === 'parts');
  if (!parts?.itemFields) throw new Error('parts.itemFields not found -- template shape has changed');

  const group = 'Road Surface & Parking Bays';
  const additions: { after: string; fields: Omit<TemplateField, 'order'>[] }[] = [
    { after: 'guardRails', fields: damageFollowUp('guardRails', 'Guard Rails', 'guardRails', group) },
    { after: 'retainingWalls', fields: damageFollowUp('retainingWalls', 'Retaining Walls', 'retainingWalls', group) },
    { after: 'bridges', fields: damageFollowUp('bridges', 'Bridges', 'bridges', group) },
  ];

  let itemFields = parts.itemFields as unknown as Omit<TemplateField, 'order'>[];
  for (const { after, fields: newFields } of additions) {
    const idx = itemFields.findIndex((f) => f.key === after);
    if (idx === -1) throw new Error(`Could not find field "${after}" to insert after -- template shape has changed`);
    itemFields = [...itemFields.slice(0, idx + 1), ...newFields, ...itemFields.slice(idx + 1)];
  }
  parts.itemFields = numbered(itemFields);

  const draft = await prisma.inspectionTemplate.create({
    data: {
      inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY,
      name: published.name,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: numbered(fields as unknown as Omit<TemplateField, 'order'>[]) as unknown as object,
      createdById: admin.id,
    },
  });

  await prisma.$transaction([
    prisma.inspectionTemplate.updateMany({
      where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' },
    }),
    prisma.inspectionTemplate.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`[public-assets-roadsurface-followup] published elevations v${draft.version} (${parts.itemFields.length} parts.itemFields)`);

  await prisma.$disconnect();
}

void main();
