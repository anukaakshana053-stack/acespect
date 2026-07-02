import { Router } from 'express';
import multer from 'multer';
import { inspectionsController } from './inspections.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { submitInspectionSchema } from './inspections.schemas';

const router = Router();

// In-memory upload (buffer forwarded to Supabase); 15 MB cap per photo.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.post('/submit', requireAuth, validate(submitInspectionSchema), inspectionsController.submit);
router.post('/photos', requireAuth, upload.single('photo'), inspectionsController.uploadPhoto);
router.get('/:id', requireAuth, inspectionsController.getById);

export const inspectionsRouter = router;
