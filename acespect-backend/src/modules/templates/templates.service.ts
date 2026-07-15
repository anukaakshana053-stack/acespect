import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { CreateTemplateInput, UpdateTemplateInput } from './templates.schemas';

/** Mobile-facing: the current published template for a section, e.g. "job-info". */
async function getActive(sectionKey: string) {
  const row = await prisma.inspectionTemplate.findFirst({
    where: { sectionKey, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!row) throw ApiError.notFound(`No published template for "${sectionKey}"`);
  return row;
}

/** Admin: all versions for a section, newest first. */
async function list(sectionKey: string) {
  return prisma.inspectionTemplate.findMany({
    where: { sectionKey },
    orderBy: { version: 'desc' },
  });
}

async function getById(id: string) {
  const row = await prisma.inspectionTemplate.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound('Template not found');
  return row;
}

/** Admin: start a new draft. If a version already exists for this sectionKey, increments it. */
async function create(createdById: string, input: CreateTemplateInput) {
  const latest = await prisma.inspectionTemplate.findFirst({
    where: { sectionKey: input.sectionKey },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return prisma.inspectionTemplate.create({
    data: {
      sectionKey: input.sectionKey,
      name: input.name,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      fields: input.fields as Prisma.InputJsonValue,
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
      ...(input.fields !== undefined ? { fields: input.fields as Prisma.InputJsonValue } : {}),
    },
  });
}

/**
 * Admin: publish a draft. Archives whatever was previously published for the
 * same sectionKey (never mutates it) so inspections already mid-draft keep
 * rendering the version they started with.
 */
async function publish(id: string) {
  const existing = await getById(id);
  if (existing.status !== 'DRAFT') {
    throw ApiError.badRequest('Only a draft template can be published');
  }
  const [, published] = await prisma.$transaction([
    prisma.inspectionTemplate.updateMany({
      where: { sectionKey: existing.sectionKey, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' },
    }),
    prisma.inspectionTemplate.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    }),
  ]);
  return published;
}

export const templatesService = { getActive, list, getById, create, update, publish };
