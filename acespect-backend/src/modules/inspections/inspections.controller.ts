import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { inspectionsService } from './inspections.service';

/** Thin HTTP layer for inspection submission + lookup. */
export const inspectionsController = {
  // Returns 202 — accepted for async review, not "done".
  submit: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { inspection, reviewJob } = await inspectionsService.submit(req.user.id, req.body);
    res.status(202).json({
      inspectionId: inspection.id,
      reviewJobId: reviewJob.id,
      status: reviewJob.status,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Inspection id is required');
    const inspection = await inspectionsService.getById(id);
    res.status(200).json({ inspection });
  }),

  // multipart/form-data with a single "photo" file → { id, storageKey, url }.
  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const file = req.file;
    if (!file) throw ApiError.badRequest('No photo file (field name must be "photo")');
    const result = await inspectionsService.uploadPhoto(file.buffer, file.mimetype, file.originalname);
    res.status(201).json(result);
  }),
};
