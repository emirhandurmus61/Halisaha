import { Router } from 'express';
import {
  getAllReservations,
  getReservationById,
  createReservation,
  getAvailableSlots,
  cancelReservation,
  getReservationPlayers,
} from '../controllers/reservation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public route
router.get('/available-slots', getAvailableSlots);

// Protected routes
router.use(authenticateToken);

router.get('/', getAllReservations);
router.get('/:id/players', getReservationPlayers);
router.get('/:id', getReservationById);
router.post('/', createReservation);
router.patch('/:id/cancel', cancelReservation);

export default router;
