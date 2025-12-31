import { Request, Response } from 'express';
import { pool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import { generateToken } from '../utils/jwt.utils';

// ====================================
// REGISTER (Üye Ol)
// ====================================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, userType, username } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, şifre, ad, soyad ve kullanıcı adı gereklidir',
      });
    }

    // Email kontrolü
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      const message = existing.email === email
        ? 'Bu email adresi zaten kullanılıyor'
        : 'Bu kullanıcı adı zaten kullanılıyor';
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Şifreyi hashle
    const passwordHash = await hashPassword(password);

    // Kullanıcıyı oluştur
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type, username)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, user_type, username, created_at`,
      [email, passwordHash, firstName, lastName, phone || null, userType || 'player', username]
    );

    const user = result.rows[0];

    // JWT token oluştur
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    });

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt sırasında bir hata oluştu',
      error: error.message,
    });
  }
};

// ====================================
// LOGIN (Giriş Yap)
// ====================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gereklidir',
      });
    }

    // Kullanıcıyı bul
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, user_type, is_active
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı',
      });
    }

    const user = result.rows[0];

    // Hesap aktif mi kontrol et
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız devre dışı bırakılmış',
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı',
      });
    }

    // Son giriş zamanını güncelle
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // JWT token oluştur
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    });

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında bir hata oluştu',
      error: error.message,
    });
  }
};

// ====================================
// GET PROFILE (Profil Bilgisi)
// ====================================
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, phone, user_type,
              profile_data, trust_score, elo_rating, total_matches_played,
              current_streak, longest_streak, badges, created_at
       FROM users
       WHERE id = $1`,
      [userId]
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
        username: user.username,
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgisi alınırken hata oluştu',
      error: error.message,
    });
  }
};
