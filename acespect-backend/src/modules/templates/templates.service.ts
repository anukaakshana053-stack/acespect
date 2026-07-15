import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { CreateTemplateInput, UpdateTemplateInput } from './templates.schemas';

interface Lineage {
  inspectionType: string;
  propertyType: string;
  sectionKey: string;
}

/** Mobile/web-facing: the current published template for a profile+section. */
async function getActive({ inspectionType, propertyType, sectionKey }: Lineage) {
  const row = await prisma.inspectionTemplate.findFirst({
    where: { inspectionType, propertyType, sectionKey, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!row) {
    throw ApiError.notFound(`No published template for ${inspectionType}/${propertyType}/${sectionKey}`);
  }
  return row;
}

/** Admin: all versions for one lineage, newest first. */
async function list({ inspectionType, propertyType, sectionKey }: Lineage) {
  return prisma.inspectionTemplate.findMany({
    where: { inspectionType, propertyType, sectionKey },
    orderBy: { version: 'desc' },
  });
}

/**
 * Admin: one row per templatable section for a profile, so the section-list
 * page can render its whole board with a single request instead of one
 * round trip per section.
 */
async function summary(inspectionType: string, propertyType: string, sectionKeys: string[]) {
  const rows = await prisma.inspectionTemplate.findMany({
    where: { inspectionType, propertyType, sectionKey: { in: sectionKeys } },
    orderBy: { version: 'desc' },
    select: { id: true, sectionKey: true, version: true, status: true, publishedAt: true },
  });
  return sectionKeys.map((sectionKey) => {
    const forSection = rows.filter((r) => r.sectionKey === sectionKey);
    const published = forSection.find((r) => r.status === 'PUBLISHED');
    const draft = forSection.find((r) => r.status === 'DRAFT');
    return {
      sectionKey,
      publishedVersion: published?.version ?? null,
      publishedAt: published?.publishedAt ?? null,
      hasDraft: !!draft,
      draftId: draft?.id ?? null,
    };
  });
}

async function getById(id: string) {
  const row = await prisma.inspectionTemplate.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound('Template not found');
  return row;
}

/** Admin: start a new draft. If a version already exists for this lineage, increments it. */
async function create(createdById: string, input: CreateTemplateInput) {
  const latest = await prisma.inspectionTemplate.findFirst({
    where: {
      inspectionType: input.inspectionType,
      propertyType: input.propertyType,
      sectionKey: input.sectionKey,
    },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return prisma.inspectionTemplate.create({
    data: {
      inspectionType: input.inspectionType,
      propertyType: input.propertyType,
      sectionKey: input.sectionKey,
      name: input.name,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: input.fields as unknown as Prisma.InputJsonValue,
      createdById,
    },
  });
}

/** Admin: edit a draft's name/fields. Only DRAFT templates are mutable. */
async function update(id: string, input: UpdateTemplateInput) {
  const existing = await getById(id);
  if (existing.status !== 'DRAFT') {
    throw ApiError.badRequest('Only a draft template can be edited — publish creates a new version instead');
  }
  return prisma.inspectionTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.fields !== undefined ? { fields: input.fields as unknown as Prisma.InputJsonValue } : {}),
    },
  });
}

/**
 * Admin: publish a draft. Archives whatever was previously published for the
 * same (inspectionType, propertyType, sectionKey) lineage (never mutates it)
 * so inspections already mid-draft keep rendering the version they started
 * with.
 */
async function publish(id: string) {
  const existing = await getById(id);
  if (existing.status !== 'DRAFT') {
    throw ApiError.badRequest('Only a draft template can be published');
  }
  const [, published] = await prisma.$transaction([
    prisma.inspectionTemplate.updateMany({
      where: {
        inspectionType: existing.inspectionType,
        propertyType: existing.propertyType,
        sectionKey: existing.sectionKey,
        status: 'PUBLISHED',
      },
      data: { status: 'ARCHIVED' },
    }),
    prisma.inspectionTemplate.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    }),
  ]);
  return published;
}

export const templatesService = { getActive, list, summary, getById, create, update, publish };
