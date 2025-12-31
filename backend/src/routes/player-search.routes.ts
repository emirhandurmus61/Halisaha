import { Router } from 'express';
import {
  getAllPlayerSearches,
  getMyPlayerSearches,
  getPlayerSearchById,
  createPlayerSearch,
  joinPlayerSearch,
  leavePlayerSearch,
  cancelPlayerSearch,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
} from '../controllers/player-search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllPlayerSearches);
router.get('/:id', getPlayerSearchById);

// Protected routes
router.use(authenticateToken);

router.get('/my/listings', getMyPlayerSearches);
router.post('/', createPlayerSearch);
router.post('/:id/join', joinPlayerSearch);
router.post('/:id/leave', leavePlayerSearch);
router.patch('/:id/cancel', cancelPlayerSearch);

// Katılım isteği yönetimi
router.get('/reservations/:reservationId/requests', getPendingRequests);
router.patch('/requests/:requestId/accept', acceptRequest);
router.patch('/requests/:requestId/reject', rejectRequest);

export default router;
