import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { templatesService } from './templates.service';
import { serializeTemplate } from './templates.serializers';

export const templatesController = {
  getActive: asyncHandler(async (req: Request, res: Response) => {
    const { sectionKey } = req.params;
    if (!sectionKey) throw ApiError.badRequest('Section key is required');
    const template = await templatesService.getActive(sectionKey);
    res.status(200).json({ template: serializeTemplate(template) });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const sectionKey = req.query.sectionKey;
    if (typeof sectionKey !== 'string' || !sectionKey) {
      throw ApiError.badRequest('sectionKey query param is required');
    }
    const templates = await templatesService.list(sectionKey);
    res.status(200).json({ templates: templates.map(serializeTemplate) });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Template id is required');
    const template = await templatesService.getById(id);
    res.status(200).json({ template: serializeTemplate(template) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const template = await templatesService.create(req.user.id, req.body);
    res.status(201).json({ template: serializeTemplate(template) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Template id is required');
    const template = await templatesService.update(id, req.body);
    res.status(200).json({ template: serializeTemplate(template) });
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Template id is required');
    const template = await templatesService.publish(id);
    res.status(200).json({ template: serializeTemplate(template) });
  }),
};
