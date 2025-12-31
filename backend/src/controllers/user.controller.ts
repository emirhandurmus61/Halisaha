import { Request, Response } from 'express';
import { pool } from '../config/database';
import path from 'path';
import fs from 'fs';
import { hashPassword, comparePassword } from '../utils/hash.utils';

// Tüm kullanıcıları listele
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, user_type, trust_score,
              elo_rating, total_matches_played, created_at
       FROM users
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        trustScore: user.trust_score,
        eloRating: user.elo_rating,
        totalMatchesPlayed: user.total_matches_played,
        createdAt: user.created_at,
      })),
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Kullanıcı detayını getir
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, user_type,
              profile_data, trust_score, elo_rating, total_matches_played,
              current_streak, longest_streak, badges, created_at
       FROM users
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userType: user.user_type,
        profileData: user.profile_data,
        trustScore: user.trust_score,
        eloRating: user.elo_rating,
        totalMatchesPlayed: user.total_matches_played,
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak,
        badges: user.badges,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgisi alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Profil resmini güncelle
export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profil resmi yüklenmedi',
      });
    }

    // Eski profil resmini sil
    const oldUserResult = await pool.query(
      'SELECT profile_data FROM users WHERE id = $1',
      [userId]
    );

    if (oldUserResult.rows.length > 0 && oldUserResult.rows[0].profile_data?.profilePicture) {
      const oldPicturePath = path.join(__dirname, '../../', oldUserResult.rows[0].profile_data.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Yeni profil resminin yolunu kaydet
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;

    // Veritabanını güncelle
    const result = await pool.query(
      `UPDATE users
       SET profile_data = COALESCE(profile_data, '{}'::jsonb) || jsonb_build_object('profilePicture', $1::text),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2::uuid
       RETURNING profile_data`,
      [profilePicturePath, userId]
    );

    res.json({
      success: true,
      message: 'Profil resmi başarıyla güncellendi',
      data: {
        profileData: result.rows[0].profile_data,
      },
    });
  } catch (error: any) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil resmi güncellenirken hata oluştu',
      error: error.message,
    });
  }
};

// Profil bilgilerini güncelle
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, username, email, phone } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Email veya username değişiyorsa, zaten kullanılıyor mu kontrol et
    if (email || username) {
      const checkQuery = [];
      const checkParams = [];
      let paramIndex = 1;

      if (email) {
        checkQuery.push(`email = $${paramIndex}`);
        checkParams.push(email);
        paramIndex++;
      }

      if (username) {
        checkQuery.push(`username = $${paramIndex}`);
        checkParams.push(username);
        paramIndex++;
      }

      checkParams.push(userId);

      const existingUser = await pool.query(
        `SELECT id, email, username FROM users WHERE (${checkQuery.join(' OR ')}) AND id != $${paramIndex}`,
        checkParams
      );

      if (existingUser.rows.length > 0) {
        const existing = existingUser.rows[0];
        if (existing.email === email) {
          return res.status(400).json({
            success: false,
            message: 'Bu email adresi zaten kullanılıyor',
          });
        }
        if (existing.username === username) {
          return res.status(400).json({
            success: false,
            message: 'Bu kullanıcı adı zaten kullanılıyor',
          });
        }
      }
    }

    // Profil bilgilerini güncelle
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, username = $3, email = $4, phone = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, username, first_name, last_name, phone, user_type, profile_data`,
      [firstName, lastName, username, email, phone || null, userId]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profil bilgileri başarıyla güncellendi',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        userType: user.user_type,
        profileData: user.profile_data,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken hata oluştu',
      error: error.message,
    });
  }
};

// Şifre değiştir
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre gereklidir',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır',
      });
    }

    // Mevcut şifreyi kontrol et
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const isPasswordValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre hatalı',
      });
    }

    // Yeni şifreyi hashle ve güncelle
    const newPasswordHash = await hashPassword(newPassword);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre değiştirilirken hata oluştu',
      error: error.message,
    });
  }
};
