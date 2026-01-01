import { Router } from 'express';
import {
  getMyTeam,
  createTeam,
  searchPlayers,
  invitePlayer,
  getMyInvitations,
  respondToInvitation,
  updateTeam,
  updateTeamLogo,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getTeamMatches,
} from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadTeamLogo } from '../middleware/upload.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

router.get('/my-team', getMyTeam);
router.post('/', createTeam);
router.put('/update', updateTeam);
router.post('/logo', uploadTeamLogo.single('logo'), updateTeamLogo);
router.get('/search-players', searchPlayers);
router.post('/invite', invitePlayer);
router.get('/my-invitations', getMyInvitations);
router.post('/invitations/:invitationId/respond', respondToInvitation);

// Bildirim route'ları
router.get('/notifications', getNotifications);
router.post('/notifications/:notificationId/read', markNotificationAsRead);
router.post('/notifications/read-all', markAllNotificationsAsRead);

// Takım maçları
router.get('/matches', getTeamMatches);

export default router;
