// One-off content patch: publishes a v4 for the Dilapidation + Public Assets
// profile's description template, closing the last gap found when auditing
// against the source PDF page by page: the PDF's line "Inspector if
// something else please define...." sits directly under the proposed-works/
// side/direction rows, meaning picking "Other" on any of them should let the
// inspector say what it is -- but proposedWorksType, siteSide and
// siteDirection are plain pill-selects with no follow-up field. Adds a
// gated free-text field after each, appearing only when that field's value
// is its "Other" option. Only this one section/profile is touched; uses the
// existing versioning flow (archive prior published row, publish the new
// one).
import { prisma } from '../lib/prisma';
import { TemplateField } from '../modules/templates/templates.schemas';

const INSPECTION_TYPE = 'dilapidation';
const PROPERTY_TYPE = 'public_assets';
const SECTION_KEY = 'description';

function numbered(fields: Omit<TemplateField, 'order'>[]): TemplateField[] {
  return fields.map((f, i) => ({
    ...f,
    order: i,
    itemFields: f.itemFields ? numbered(f.itemFields as Omit<TemplateField, 'order'>[]) : undefined,
  }));
}

async function main() {
  const published = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!published) throw new Error('No published description template found for dilapidation/public_assets');

  const latest = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('no ADMIN user found');

  const fields = published.fields as unknown as TemplateField[];

  const findOtherValue = (key: string): string => {
    const f = fields.find((x) => x.key === key);
    const otherOpt = f?.options?.find((o) => o.label === 'Other');
    if (!otherOpt) throw new Error(`Could not find an "Other" option on field "${key}" -- template shape has changed`);
    return otherOpt.value;
  };

  const additions: { after: string; key: string; label: string }[] = [
    { after: 'proposedWorksType', key: 'proposedWorksTypeOther', label: 'If Other, please define' },
    { after: 'siteSide', key: 'siteSideOther', label: 'If Other, please define' },
    { after: 'siteDirection', key: 'siteDirectionOther', label: 'If Other, please define' },
  ];

  let next = [...fields] as unknown as Omit<TemplateField, 'order'>[];
  for (const { after, key, label } of additions) {
    const gate = { fieldKey: after, equals: findOtherValue(after) };
    const idx = next.findIndex((f) => f.key === after);
    if (idx === -1) throw new Error(`Could not find field "${after}" to insert after -- template shape has changed`);
    const newField: Omit<TemplateField, 'order'> = { key, label, type: 'text', gate };
    next = [...next.slice(0, idx + 1), newField, ...next.slice(idx + 1)];
  }

  const numberedFields = numbered(next);

  const draft = await prisma.inspectionTemplate.create({
    data: {
      inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey: SECTION_KEY,
      name: published.name,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: numberedFields as unknown as object,
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
  console.log(`[public-assets-other-followup] published description v${draft.version} (${numberedFields.length} fields)`);

  await prisma.$disconnect();
}

void main();
