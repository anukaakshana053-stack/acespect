import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { reviewQueue, reviewJobKey } from '../../lib/queue';
import { SubmitInspectionInput } from './inspections.schemas';

const SEC_STATUS: Record<string, 'COMPLETE' | 'PARTIAL' | 'PENDING'> = {
  complete: 'COMPLETE',
  partial: 'PARTIAL',
  pending: 'PENDING',
};

/**
 * Persist a submitted inspection with its structured sections + damages, assign
 * a reviewer, and enqueue the async multi-agent review. The nested create is a
 * single transaction. Returns immediately — the review runs asynchronously.
 */
async function submit(inspectorId: string, input: SubmitInspectionInput) {
  // Land it in a reviewer's queue (first active reviewer).
  const reviewer = await prisma.user.findFirst({
    where: { role: 'REVIEWER', isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const inspection = await prisma.inspection.create({
    data: {
      inspectorId,
      reviewerId: reviewer?.id ?? null,
      inspectionType: input.inspectionType,
      propertyType: input.propertyType,
      jobNo: input.jobNo,
      address: input.address,
      suburb: input.suburb,
      client: input.client,
      date: input.date ? new Date(input.date) : new Date(),
      notes: input.notes ?? '',
      overallProgress: input.overallProgress ?? 0,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      ...(input.payload ? { payload: input.payload as Prisma.InputJsonValue } : {}),
      sections: {
        create: input.sections.map((s) => ({
          key: s.key,
          name: s.name,
          icon: s.icon,
          order: s.order,
          status: SEC_STATUS[s.status] ?? 'PENDING',
          reportText: s.reportText,
          fields: s.fields as Prisma.InputJsonValue,
          photos: s.photos as unknown as Prisma.InputJsonValue,
          damages: {
            create: s.damages.map((d) => ({
              type: d.type,
              location: d.location,
              direction: d.direction,
              widthMm: d.widthMm,
              lengthMm: d.lengthMm,
              notes: d.notes,
              photos: d.photos as unknown as Prisma.InputJsonValue,
              order: d.order,
            })),
          },
        })),
      },
    },
  });

  const reviewJob = await prisma.reviewJob.create({
    data: { inspectionId: inspection.id, version: inspection.version },
  });

  // Deterministic jobId makes a duplicate enqueue a no-op.
  await reviewQueue.add(
    'review',
    { reviewJobId: reviewJob.id, inspectionId: inspection.id, version: inspection.version },
    { jobId: reviewJobKey(inspection.id, inspection.version) },
  );

  return { inspection, reviewJob };
}

/** Fetch an inspection with its latest review job + summary. */
async function getById(id: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      reviewSummary: true,
      reviewJobs: { orderBy: { queuedAt: 'desc' }, take: 1, include: { results: true } },
    },
  });
  if (!inspection) throw ApiError.notFound('Inspection not found');
  return inspection;
}

/** Upload one inspection photo to Supabase Storage; returns its public URL. */
async function uploadPhoto(buffer: Buffer, contentType: string, originalName: string) {
  const { isStorageEnabled, uploadPhoto: store } = await import('../../lib/storage');
  if (!isStorageEnabled()) {
    throw new ApiError(
      503,
      'Photo storage is not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
      'STORAGE_DISABLED',
    );
  }
  const ext = (originalName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return store(buffer, contentType || 'image/jpeg', ext);
}

export const inspectionsService = { submit, getById, uploadPhoto };
