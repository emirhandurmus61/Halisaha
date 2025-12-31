import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        userType: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth Header:', authHeader);
    console.log('Token:', token);

    if (!token) {
      console.log('Token bulunamadı!');
      return res.status(401).json({
        success: false,
        message: 'Erişim token\'ı bulunamadı',
      });
    }

    const decoded = verifyToken(token);
    console.log('Decoded:', decoded);

    if (!decoded) {
      console.log('Token decode edilemedi!');
      return res.status(403).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({
      success: false,
      message: 'Token doğrulama hatası',
    });
  }
};

// Sadece admin kullanıcılar için middleware
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir',
    });
  }
  next();
};

// Sadece tesis sahipleri için middleware
export const requireVenueOwner = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.userType !== 'venue_owner' && req.user?.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için tesis sahibi yetkisi gereklidir',
    });
  }
  next();
};
