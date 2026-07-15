import { Router } from 'express';
import { templatesController } from './templates.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createTemplateSchema, updateTemplateSchema } from './templates.schemas';

const router = Router();
const admin = requireRole('ADMIN');

// Mobile + web: current published template for a section (any authenticated role).
router.get('/active/:sectionKey', requireAuth, templatesController.getActive);

// Admin: template CRUD + publish.
router.get('/', requireAuth, admin, templatesController.list);
router.get('/:id', requireAuth, admin, templatesController.getById);
router.post('/', requireAuth, admin, validate(createTemplateSchema), templatesController.create);
router.patch('/:id', requireAuth, admin, validate(updateTemplateSchema), templatesController.update);
router.post('/:id/publish', requireAuth, admin, templatesController.publish);

export const templatesRouter = router;
