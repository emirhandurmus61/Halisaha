import { Router } from 'express';
import {
  getAllVenues,
  getVenueById,
  createVenue,
} from '../controllers/venue.controller';
import { authenticateToken, requireVenueOwner } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllVenues);
router.get('/:id', getVenueById);

// Protected routes (venue owner veya admin)
router.post('/', authenticateToken, requireVenueOwner, createVenue);

export default router;
