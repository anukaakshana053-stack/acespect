import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { DecisionInput } from './review.schemas';

/** Review job + its per-agent results — what the dashboard polls for status. */
async function getJob(id: string) {
  const job = await prisma.reviewJob.findUnique({
    where: { id },
    include: { results: true },
  });
  if (!job) throw ApiError.notFound('Review job not found');
  return job;
}

/** Reviewer dashboard list: every inspection with its latest job status + summary. */
async function listInspections() {
  const inspections = await prisma.inspection.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      inspector: { select: { name: true, email: true } },
      reviewSummary: { select: { id: true, riskScore: true, status: true } },
      reviewJobs: { orderBy: { queuedAt: 'desc' }, take: 1, select: { status: true } },
    },
  });
  return inspections.map((i) => ({
    id: i.id,
    inspectionType: i.inspectionType,
    propertyType: i.propertyType,
    submittedAt: i.submittedAt,
    inspector: i.inspector,
    jobStatus: i.reviewJobs[0]?.status ?? null,
    summary: i.reviewSummary,
  }));
}

/** Full review detail for one inspection: agent findings, summary, decisions. */
async function getInspectionDetail(id: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      inspector: { select: { name: true, email: true } },
      reviewSummary: {
        include: {
          decisions: {
            orderBy: { decidedAt: 'desc' },
            include: { reviewer: { select: { name: true, email: true } } },
          },
        },
      },
      reviewJobs: { orderBy: { queuedAt: 'desc' }, take: 1, include: { results: true } },
    },
  });
  if (!inspection) throw ApiError.notFound('Inspection not found');
  return inspection;
}

/** Record a human reviewer's decision on a summary (the audit trail) and flip
 *  the summary's status. AI output stays advisory — this is the final word. */
async function recordDecision(summaryId: string, reviewerId: string, input: DecisionInput) {
  const summary = await prisma.reviewSummary.findUnique({ where: { id: summaryId } });
  if (!summary) throw ApiError.notFound('Review summary not found');

  const [, decision] = await prisma.$transaction([
    prisma.reviewSummary.update({
      where: { id: summaryId },
      data: {
        status: input.decision,
        ...(input.summaryText ? { summaryText: input.summaryText } : {}),
      },
    }),
    prisma.reviewDecision.create({
      data: {
        reviewSummaryId: summaryId,
        reviewerId,
        decision: input.decision,
        notes: input.notes,
      },
      include: { reviewer: { select: { name: true, email: true } } },
    }),
  ]);
  return decision;
}

export const reviewService = { getJob, listInspections, getInspectionDetail, recordDecision };
