import { Request, Response } from 'express';
import { pool } from '../config/database';

// Oyuncu değerlendirmesi oluştur
export const createRating = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      reservationId,
      ratedUserId,
      speedRating,
      techniqueRating,
      passingRating,
      physicalRating,
      showedUp,
      causedTrouble,
      wasLate,
      comment
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Rezervasyonun geçmişte olduğunu kontrol et
    const reservationCheck = await pool.query(
      `SELECT r.*, r.reservation_date, r.end_time
       FROM reservations r
       WHERE r.id = $1`,
      [reservationId]
    );

    if (reservationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı',
      });
    }

    const reservation = reservationCheck.rows[0];
    const reservationDateTime = new Date(reservation.reservation_date + 'T' + reservation.end_time);
    const now = new Date();

    if (reservationDateTime > now) {
      return res.status(400).json({
        success: false,
        message: 'Sadece geçmiş maçlar için değerlendirme yapılabilir',
      });
    }

    // Daha önce değerlendirme yapılmış mı kontrol et
    const existingRating = await pool.query(
      `SELECT id FROM player_ratings
       WHERE reservation_id = $1 AND rated_user_id = $2 AND rater_user_id = $3`,
      [reservationId, ratedUserId, userId]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu oyuncuyu bu maç için zaten değerlendirdiniz',
      });
    }

    // Değerlendirme oluştur
    const result = await pool.query(
      `INSERT INTO player_ratings (
        reservation_id, rated_user_id, rater_user_id,
        speed_rating, technique_rating, passing_rating, physical_rating,
        showed_up, caused_trouble, was_late, comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        reservationId,
        ratedUserId,
        userId,
        speedRating,
        techniqueRating,
        passingRating,
        physicalRating,
        showedUp !== undefined ? showedUp : true,
        causedTrouble !== undefined ? causedTrouble : false,
        wasLate !== undefined ? wasLate : false,
        comment || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Değerlendirme başarıyla kaydedildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Değerlendirme kaydedilirken hata oluştu',
      error: error.message,
    });
  }
};

// Bir kullanıcının aldığı değerlendirmeleri getir
export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM user_rating_stats WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          userId,
          totalRatingsReceived: 0,
          avgSpeed: 0,
          avgTechnique: 0,
          avgPassing: 0,
          avgPhysical: 0,
          avgOverall: 0,
        },
      });
    }

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        userId: stats.user_id,
        totalRatingsReceived: parseInt(stats.total_ratings_received || '0'),
        avgSpeed: parseInt(stats.avg_speed || '0'),
        avgTechnique: parseInt(stats.avg_technique || '0'),
        avgPassing: parseInt(stats.avg_passing || '0'),
        avgPhysical: parseInt(stats.avg_physical || '0'),
        avgOverall: parseInt(stats.avg_overall || '0'),
      },
    });
  } catch (error: any) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Değerlendirmeler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Bir rezervasyon için değerlendirilebilecek oyuncuları getir
export const getRateablePlayers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { reservationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Rezervasyonu kontrol et
    const reservationCheck = await pool.query(
      `SELECT * FROM reservations WHERE id = $1 AND user_id = $2`,
      [reservationId, userId]
    );

    if (reservationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı veya size ait değil',
      });
    }

    // Rezervasyonda kayıtlı oyuncuları getir (rezervasyon yapan hariç)
    const players = await pool.query(
      `SELECT DISTINCT u.id as "userId", u.first_name as "firstName", u.last_name as "lastName", u.email
       FROM reservation_players rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.reservation_id = $1 AND rp.user_id != $2
       ORDER BY u.first_name, u.last_name`,
      [reservationId, userId]
    );

    res.json({
      success: true,
      data: players.rows,
    });
  } catch (error: any) {
    console.error('Get rateable players error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncular alınırken hata oluştu',
      error: error.message,
    });
  }
};
