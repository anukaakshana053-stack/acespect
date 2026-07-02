import { Router } from 'express';
import { reviewController } from './review.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { decisionSchema } from './review.schemas';

const router = Router();

// Job status — any authenticated user (the submitting app polls this).
router.get('/jobs/:id', requireAuth, reviewController.getJob);

// Reviewer dashboard — gated to REVIEWER / ADMIN.
const reviewers = requireRole('REVIEWER', 'ADMIN');
router.get('/inspections', requireAuth, reviewers, reviewController.listInspections);
router.get('/inspections/:id', requireAuth, reviewers, reviewController.getInspectionDetail);
router.post(
  '/summaries/:id/decision',
  requireAuth,
  reviewers,
  validate(decisionSchema),
  reviewController.decide,
);

export const reviewRouter = router;
