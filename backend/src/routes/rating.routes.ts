import { Router } from 'express';
import {
  createRating,
  getUserRatings,
  getRateablePlayers
} from '../controllers/rating.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

router.post('/', createRating);
router.get('/user/:userId', getUserRatings);
router.get('/reservation/:reservationId/players', getRateablePlayers);

export default router;
