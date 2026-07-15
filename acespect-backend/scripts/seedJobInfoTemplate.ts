// Seeds a published v1 "Job Information" template matching today's hardcoded
// mobile fields, so the app always has something to render even before an
// admin edits it. Run: npx tsx scripts/seedJobInfoTemplate.ts
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';

const SECTION_KEY = 'job-info';

const FIELDS = [
  { key: 'jobNumber', label: 'Job Number', type: 'text', order: 0, required: true },
  { key: 'inspectionDate', label: 'Inspection Date', type: 'date', order: 1, required: true },
  { key: 'clientName', label: 'Client Name', type: 'text', order: 2, required: true },
  { key: 'inspectionAddress', label: 'Inspection Address', type: 'text', order: 3, required: true },
  { key: 'assignedInspector', label: 'Assigned Inspector', type: 'text', order: 4, required: true, readOnly: true },
  {
    key: 'weather',
    label: 'Current Onsite Weather',
    type: 'select-tiles',
    order: 5,
    required: true,
    options: [
      { value: 'sunny', label: 'Sunny', icon: 'sunny-outline' },
      { value: 'overcast', label: 'Overcast', icon: 'cloud-outline' },
      { value: 'dry', label: 'Dry', icon: 'reorder-two-outline' },
      { value: 'intermittent_showers', label: 'Intermittent Showers', icon: 'rainy-outline' },
      { value: 'rain', label: 'Rain', icon: 'water-outline' },
      { value: 'other', label: 'Other', icon: 'help-circle-outline' },
    ],
  },
  {
    key: 'usedAsBusiness',
    label: 'Is this property currently being used as a business?',
    type: 'yesno',
    order: 6,
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

async function main() {
  // Admin is normally seeded by seedInspection.ts; upsert defensively so this
  // script also works standalone against a fresh database.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acespect.app' },
    update: { role: 'ADMIN', isActive: true },
    create: {
      email: 'admin@acespect.app',
      name: 'Admin User',
      passwordHash: await hashPassword('Admin123'),
      role: 'ADMIN',
      avatar: 'AU',
      region: 'VIC',
    },
  });

  const existing = await prisma.inspectionTemplate.findFirst({
    where: { sectionKey: SECTION_KEY, status: 'PUBLISHED' },
  });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`⏭  A published "${SECTION_KEY}" template already exists (v${existing.version}) — skipping.`);
    await prisma.$disconnect();
    return;
  }

  const template = await prisma.inspectionTemplate.create({
    data: {
      sectionKey: SECTION_KEY,
      name: 'Job Information',
      version: 1,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      fields: FIELDS,
      createdById: admin.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ seeded template ${template.id} (${template.sectionKey} v${template.version}, PUBLISHED)`);
  await prisma.$disconnect();
}

void main();
