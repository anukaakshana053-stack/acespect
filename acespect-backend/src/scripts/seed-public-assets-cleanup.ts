// One-off content patch: publishes new versions for the Dilapidation +
// Public Assets profile's job-info, description and notes templates,
// removing fields that were never part of the source PDF ("Dilapidation
// PUBLIC ASSETS Type 1 - Inspector template") -- they were inherited
// unchanged from the generic building-inspection defaults every profile
// starts from, and don't make sense for a road/laneway/street-asset
// survey (e.g. "Is this property used as a business?", building elevation
// photo categories, a bouncy-floors/doors-binding movement checklist).
// The elevations template was already a full from-scratch rebuild for
// this profile, so nothing to remove there. Only this one profile is
// touched; uses the existing versioning flow.
import { prisma } from '../lib/prisma';
import { TemplateField } from '../modules/templates/templates.schemas';

const INSPECTION_TYPE = 'dilapidation';
const PROPERTY_TYPE = 'public_assets';

function numbered(fields: Omit<TemplateField, 'order'>[]): TemplateField[] {
  return fields.map((f, i) => ({
    ...f,
    order: i,
    itemFields: f.itemFields ? numbered(f.itemFields as Omit<TemplateField, 'order'>[]) : undefined,
  }));
}

async function publishOverlay(sectionKey: string, dropKeys: string[]) {
  const published = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!published) throw new Error(`No published ${sectionKey} template found`);
  const latest = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('no ADMIN user found');

  const existingFields = published.fields as unknown as TemplateField[];
  const dropSet = new Set(dropKeys);
  const before = existingFields.length;
  const nextFields = numbered(existingFields.filter((f) => !dropSet.has(f.key)) as unknown as Omit<TemplateField, 'order'>[]);

  const draft = await prisma.inspectionTemplate.create({
    data: {
      inspectionType: INSPECTION_TYPE, propertyType: PROPERTY_TYPE, sectionKey,
      name: published.name,
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
  console.log(`[public-assets-cleanup] published ${sectionKey} v${draft.version} (${before} -> ${nextFields.length} fields, dropped ${before - nextFields.length})`);
}

async function main() {
  // "Is this property used as a business?" doesn't apply to a road/laneway survey.
  await publishOverlay('job-info', ['usedAsBusiness']);

  // The generic building-elevation photo categories are superseded by the PDF's
  // single "Site & Assets Overview" photo set (siteAssetsOverview), already added.
  await publishOverlay('description', [
    'front_elevation',
    'street_number',
    'street_view_context',
    'neighboring_properties',
    'relationship_construction',
    'business_signage',
  ]);

  // The generic movement checklist (bouncy floors/doors binding/balcony condition),
  // no-access list, post-project toggle, and generic damage capture are all
  // building-inspection concepts with no equivalent in this PDF -- the PDF's
  // Notes section is just the safety-matters prompt, already added.
  await publishOverlay('notes', ['movement', 'noAccess', 'postProject', 'hasDamage', 'damages', 'additionalNotes']);

  await prisma.$disconnect();
}

void main();
