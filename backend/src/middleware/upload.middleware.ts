import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Uploads dizinlerini oluştur
const profilePicturesDir = path.join(__dirname, '../../uploads/profile-pictures');
const teamLogosDir = path.join(__dirname, '../../uploads/team-logos');

if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}
if (!fs.existsSync(teamLogosDir)) {
  fs.mkdirSync(teamLogosDir, { recursive: true });
}

// Multer storage configuration for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicturesDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Multer storage configuration for team logos
const teamLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, teamLogosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `team-logo-${uniqueSuffix}${ext}`);
  },
});

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir! (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload instances
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});

export const uploadTeamLogo = multer({
  storage: teamLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});
