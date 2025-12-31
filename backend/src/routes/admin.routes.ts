import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  updateUserType,
  deleteUser,
  getAllReservations,
  updateReservationStatus,
  getAllVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  getDetailedStatistics,
  getAllTeams,
  getTeamDetails,
  deleteTeam,
} from '../controllers/admin.controller';

const router = express.Router();

// Tüm admin rotaları için authentication ve admin yetkisi gerekli
router.use(authenticateToken);
router.use(isAdmin);

// Dashboard istatistikleri
router.get('/stats', getAdminStats);

// Detaylı istatistikler
router.get('/statistics/detailed', getDetailedStatistics);

// Kullanıcı yönetimi
router.get('/users', getAllUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/type', updateUserType);
router.delete('/users/:userId', deleteUser);

// Rezervasyon yönetimi
router.get('/reservations', getAllReservations);
router.patch('/reservations/:reservationId/status', updateReservationStatus);

// Saha yönetimi
router.get('/venues', getAllVenues);
router.post('/venues', createVenue);
router.put('/venues/:venueId', updateVenue);
router.delete('/venues/:venueId', deleteVenue);

// Takım yönetimi
router.get('/teams', getAllTeams);
router.get('/teams/:teamId', getTeamDetails);
router.delete('/teams/:teamId', deleteTeam);

export default router;
