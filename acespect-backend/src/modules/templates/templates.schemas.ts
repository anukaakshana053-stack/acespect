import { z } from 'zod';

export const templateFieldSchema = z.object({
  key: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
  type: z.enum(['text', 'date', 'select-tiles', 'yesno']),
  order: z.number().int().default(0),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  placeholder: z.string().max(200).optional(),
  options: z
    .array(
      z.object({
        value: z.string().min(1).max(120),
        label: z.string().min(1).max(200),
        icon: z.string().max(60).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export const createTemplateSchema = z.object({
  sectionKey: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  fields: z.array(templateFieldSchema).max(100).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fields: z.array(templateFieldSchema).max(100).optional(),
});

export type TemplateField = z.infer<typeof templateFieldSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
