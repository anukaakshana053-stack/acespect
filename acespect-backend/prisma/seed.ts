// Seeds demo users + inspections from the web app's mockData (single source of
// truth, so the API serves exactly what the frontend was designed against).
//   Run:  npx tsx prisma/seed.ts
import { Prisma, Role, InspectionStatus, SectionStatus, SectionReviewStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';
import {
  USERS as MOCK_USERS,
  INSPECTIONS as MOCK_INSPECTIONS,
  type Inspection as MockInspection,
} from '../../acespect-web/src/web/mockData';

const ROLE: Record<string, Role> = {
  admin: Role.ADMIN,
  reviewer: Role.REVIEWER,
  inspector: Role.INSPECTOR,
};
const PASSWORD: Record<string, string> = {
  admin: 'admin123',
  reviewer: 'reviewer123',
  inspector: 'inspector123',
};
const STATUS: Record<string, InspectionStatus> = {
  draft: InspectionStatus.DRAFT,
  submitted: InspectionStatus.SUBMITTED,
  'in-review': InspectionStatus.IN_REVIEW,
  approved: InspectionStatus.APPROVED,
  rejected: InspectionStatus.REJECTED,
};
const SECTION_STATUS: Record<string, SectionStatus> = {
  complete: SectionStatus.COMPLETE,
  partial: SectionStatus.PARTIAL,
  pending: SectionStatus.PENDING,
};
const REVIEW_STATUS: Record<string, SectionReviewStatus> = {
  pending: SectionReviewStatus.PENDING,
  approved: SectionReviewStatus.APPROVED,
  'revision-requested': SectionReviewStatus.REVISION_REQUESTED,
};

async function main() {
  // Fresh inspections each run (cascades to sections/damages/review_*).
  await prisma.inspection.deleteMany({});

  // Upsert the 6 demo users; map mock id (u1..u6) -> real user id.
  const idMap = new Map<string, string>();
  for (const m of MOCK_USERS) {
    const passwordHash = await hashPassword(PASSWORD[m.role]);
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, role: ROLE[m.role], avatar: m.avatar, phone: m.phone, region: m.region },
      create: {
        email: m.email,
        name: m.name,
        role: ROLE[m.role],
        avatar: m.avatar,
        phone: m.phone,
        region: m.region,
        passwordHash,
      },
    });
    idMap.set(m.id, user.id);
  }

  // Recreate inspections with nested sections + damages.
  for (const ins of MOCK_INSPECTIONS as MockInspection[]) {
    await prisma.inspection.create({
      data: {
        jobNo: ins.jobNo,
        inspectorId: idMap.get(ins.inspectorId)!,
        reviewerId: ins.reviewerId ? idMap.get(ins.reviewerId) ?? null : null,
        address: ins.address,
        suburb: ins.suburb,
        client: ins.client,
        inspectionType: ins.type,
        propertyType: ins.propertyType,
        status: STATUS[ins.status],
        overallProgress: ins.overallProgress,
        notes: ins.notes ?? '',
        date: new Date(ins.date),
        submittedAt: ins.submittedAt ? new Date(ins.submittedAt) : null,
        sections: {
          create: ins.sections.map((s, i) => ({
            key: s.id,
            name: s.name,
            icon: s.icon,
            order: i,
            status: SECTION_STATUS[s.status],
            reviewStatus: REVIEW_STATUS[s.reviewStatus],
            reviewComment: s.reviewComment ?? '',
            reportText: s.reportText ?? '',
            fields: s.fields as Prisma.InputJsonValue,
            photos: s.photos as Prisma.InputJsonValue,
            damages: {
              create: s.damages.map((d, j) => ({
                type: d.type,
                location: d.location,
                direction: d.direction,
                widthMm: d.widthMm,
                lengthMm: d.lengthMm,
                notes: d.notes,
                photos: d.photos as Prisma.InputJsonValue,
                order: j,
              })),
            },
          })),
        },
      },
    });
  }

  const userCount = await prisma.user.count();
  const insCount = await prisma.inspection.count();
  const secCount = await prisma.section.count();
  // eslint-disable-next-line no-console
  console.log(`✅ seeded: ${userCount} users, ${insCount} inspections, ${secCount} sections`);
  await prisma.$disconnect();
}

void main();
