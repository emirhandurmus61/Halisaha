import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli',
    });
  }

  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için yetkiniz yok. Sadece adminler erişebilir.',
    });
  }

  next();
};
