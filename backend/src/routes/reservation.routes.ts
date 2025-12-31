import { Router } from 'express';
import {
  getAllReservations,
  getReservationById,
  createReservation,
  getAvailableSlots,
  cancelReservation,
} from '../controllers/reservation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.get('/available-slots', getAvailableSlots);

// Protected routes
router.use(authenticateToken);

router.get('/', getAllReservations);
router.get('/:id', getReservationById);
router.post('/', createReservation);
router.patch('/:id/cancel', cancelReservation);

export default router;
