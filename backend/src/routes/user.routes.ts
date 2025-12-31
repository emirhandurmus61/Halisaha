import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateProfilePicture,
  updateProfile,
  changePassword
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadProfilePicture } from '../middleware/upload.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/profile-picture', uploadProfilePicture.single('profilePicture'), updateProfilePicture);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

export default router;
