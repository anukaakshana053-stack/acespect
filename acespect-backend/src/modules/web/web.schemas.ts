import { z } from 'zod';

export const sectionUpdateSchema = z.object({
  reviewStatus: z.enum(['pending', 'approved', 'revision-requested']).optional(),
  reviewComment: z.string().max(2000).optional(),
  reportText: z.string().max(20000).optional(),
});

export const inspectionUpdateSchema = z.object({
  status: z.enum(['draft', 'submitted', 'in-review', 'approved', 'rejected']).optional(),
  notes: z.string().max(5000).optional(),
  reviewerId: z.string().uuid().nullable().optional(),
});

export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type InspectionUpdateInput = z.infer<typeof inspectionUpdateSchema>;
