import { Request, Response } from 'express';
import { pool } from '../config/database';

// Admin Dashboard İstatistikleri
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();

    try {
      // Toplam kullanıcı sayısı
      const usersResult = await client.query('SELECT COUNT(*) as total FROM users');
      const totalUsers = parseInt(usersResult.rows[0].total);

      // Aktif kullanıcılar (son 30 gün içinde giriş yapmış)
      const activeUsersResult = await client.query(`
        SELECT COUNT(*) as total FROM users
        WHERE last_login_at > NOW() - INTERVAL '30 days'
      `);
      const activeUsers = parseInt(activeUsersResult.rows[0].total);

      // Toplam saha sayısı
      const venuesResult = await client.query('SELECT COUNT(*) as total FROM venues');
      const totalVenues = parseInt(venuesResult.rows[0].total);

      // Toplam rezervasyon sayısı
      const reservationsResult = await client.query('SELECT COUNT(*) as total FROM reservations');
      const totalReservations = parseInt(reservationsResult.rows[0].total);

      // Bekleyen rezervasyonlar
      const pendingReservationsResult = await client.query(`
        SELECT COUNT(*) as total FROM reservations
        WHERE status = 'pending'
      `);
      const pendingReservations = parseInt(pendingReservationsResult.rows[0].total);

      // Toplam gelir
      const revenueResult = await client.query(`
        SELECT COALESCE(SUM(total_price), 0) as total FROM reservations
        WHERE status IN ('confirmed', 'completed')
      `);
      const totalRevenue = parseFloat(revenueResult.rows[0].total);

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalVenues,
          totalReservations,
          pendingReservations,
          totalRevenue,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken bir hata oluştu',
    });
  }
};

// Tüm kullanıcıları listele
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', userType = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const client = await pool.connect();

    try {
      let query = `
        SELECT
          id, email, first_name, last_name, phone, user_type,
          trust_score, elo_rating, total_matches_played,
          is_active, is_verified, created_at, last_login_at,
          profile_data
        FROM users
        WHERE 1=1
      `;
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (
          first_name ILIKE $${paramIndex} OR
          last_name ILIKE $${paramIndex} OR
          email ILIKE $${paramIndex}
        )`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (userType) {
        query += ` AND user_type = $${paramIndex}`;
        queryParams.push(userType);
        paramIndex++;
      }

      // Toplam sayıyı al
      const countResult = await client.query(
        query.replace('SELECT id, email, first_name, last_name, phone, user_type, trust_score, elo_rating, total_matches_played, is_active, is_verified, created_at, last_login_at, profile_data', 'SELECT COUNT(*) as total'),
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Sayfalı veri
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(Number(limit), offset);

      const result = await client.query(query, queryParams);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken bir hata oluştu',
    });
  }
};

// Kullanıcı durumunu güncelle
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const client = await pool.connect();

    try {
      await client.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [isActive, userId]
      );

      res.json({
        success: true,
        message: 'Kullanıcı durumu güncellendi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı durumu güncellenirken bir hata oluştu',
    });
  }
};

// Kullanıcı tipini güncelle
export const updateUserType = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { userType } = req.body;

    if (!['player', 'venue_owner', 'admin'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz kullanıcı tipi',
      });
    }

    const client = await pool.connect();

    try {
      await client.query(
        'UPDATE users SET user_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [userType, userId]
      );

      res.json({
        success: true,
        message: 'Kullanıcı tipi güncellendi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user type error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı tipi güncellenirken bir hata oluştu',
    });
  }
};

// Tüm rezervasyonları listele
export const getAllReservations = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = '', venueId = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const client = await pool.connect();

    try {
      let query = `
        SELECT
          r.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          v.name as venue_name
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN fields f ON r.field_id = f.id
        JOIN venues v ON f.venue_id = v.id
        WHERE 1=1
      `;
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND r.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }

      if (venueId) {
        query += ` AND f.venue_id = $${paramIndex}`;
        queryParams.push(venueId);
        paramIndex++;
      }

      // Toplam sayı
      const countQuery = query.replace(
        'SELECT r.*, u.first_name || \' \' || u.last_name as user_name, u.email as user_email, v.name as venue_name',
        'SELECT COUNT(*) as total'
      );
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Sayfalı veri
      query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(Number(limit), offset);

      const result = await client.query(query, queryParams);

      res.json({
        success: true,
        data: {
          reservations: result.rows,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar alınırken bir hata oluştu',
    });
  }
};

// Rezervasyon durumunu güncelle
export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum',
      });
    }

    const client = await pool.connect();

    try {
      await client.query(
        'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, reservationId]
      );

      res.json({
        success: true,
        message: 'Rezervasyon durumu güncellendi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon durumu güncellenirken bir hata oluştu',
    });
  }
};

// Tüm sahaları listele (Admin)
export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const client = await pool.connect();

    try {
      let query = 'SELECT * FROM venues WHERE 1=1';
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND name ILIKE $${paramIndex}`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Toplam sayı
      const countResult = await client.query(
        query.replace('SELECT *', 'SELECT COUNT(*) as total'),
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Sayfalı veri
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(Number(limit), offset);

      const result = await client.query(query, queryParams);

      res.json({
        success: true,
        data: {
          venues: result.rows,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get all venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Sahalar alınırken bir hata oluştu',
    });
  }
};

// Saha ekle (Admin)
export const createVenue = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      location,
      phone,
      email,
      pricePerHour,
      fieldType,
      fieldSize,
      hasParking,
      hasLockerRoom,
      hasLighting,
      openingTime,
      closingTime,
      ownerId,
    } = req.body;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO venues (
          name, description, location, phone, email, price_per_hour,
          field_type, field_size, has_parking, has_locker_room, has_lighting,
          opening_time, closing_time, owner_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
        RETURNING *`,
        [
          name, description, location, phone, email, pricePerHour,
          fieldType, fieldSize, hasParking, hasLockerRoom, hasLighting,
          openingTime, closingTime, ownerId
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Saha başarıyla oluşturuldu',
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Saha oluşturulurken bir hata oluştu',
    });
  }
};

// Saha güncelle (Admin)
export const updateVenue = async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const {
      name,
      description,
      location,
      phone,
      email,
      pricePerHour,
      fieldType,
      fieldSize,
      hasParking,
      hasLockerRoom,
      hasLighting,
      openingTime,
      closingTime,
      isActive,
    } = req.body;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE venues SET
          name = $1, description = $2, location = $3, phone = $4, email = $5,
          price_per_hour = $6, field_type = $7, field_size = $8,
          has_parking = $9, has_locker_room = $10, has_lighting = $11,
          opening_time = $12, closing_time = $13, is_active = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *`,
        [
          name, description, location, phone, email, pricePerHour,
          fieldType, fieldSize, hasParking, hasLockerRoom, hasLighting,
          openingTime, closingTime, isActive, venueId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Saha bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Saha başarıyla güncellendi',
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Saha güncellenirken bir hata oluştu',
    });
  }
};

// Saha sil (Admin)
export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;

    const client = await pool.connect();

    try {
      const result = await client.query('DELETE FROM venues WHERE id = $1 RETURNING id', [venueId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Saha bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Saha başarıyla silindi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Saha silinirken bir hata oluştu',
    });
  }
};

// Detaylı istatistikler
export const getDetailedStatistics = async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();

    try {
      // Günlük rezervasyon sayıları (son 30 gün)
      const dailyReservations = await client.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM reservations
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Kullanıcı tiplerine göre dağılım
      const userTypeDistribution = await client.query(`
        SELECT
          user_type,
          COUNT(*) as count
        FROM users
        GROUP BY user_type
      `);

      // En popüler sahalar
      const popularVenues = await client.query(`
        SELECT
          v.id,
          v.name,
          COUNT(r.id) as reservation_count,
          SUM(r.total_price) as total_revenue
        FROM venues v
        LEFT JOIN fields f ON v.id = f.venue_id
        LEFT JOIN reservations r ON f.id = r.field_id
        GROUP BY v.id, v.name
        ORDER BY reservation_count DESC
        LIMIT 10
      `);

      // Aylık gelir trendi
      const monthlyRevenue = await client.query(`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          SUM(total_price) as revenue,
          COUNT(*) as reservation_count
        FROM reservations
        WHERE status IN ('confirmed', 'completed')
          AND created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      res.json({
        success: true,
        data: {
          dailyReservations: dailyReservations.rows,
          userTypeDistribution: userTypeDistribution.rows,
          popularVenues: popularVenues.rows,
          monthlyRevenue: monthlyRevenue.rows,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get detailed statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken bir hata oluştu',
    });
  }
};

// Kullanıcıyı sil
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const client = await pool.connect();

    try {
      // Kullanıcının admin olup olmadığını kontrol et
      const userResult = await client.query('SELECT user_type FROM users WHERE id = $1', [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }

      if (userResult.rows[0].user_type === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin kullanıcılar silinemez',
        });
      }

      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      res.json({
        success: true,
        message: 'Kullanıcı silindi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu',
    });
  }
};

// Tüm takımları listele (Admin)
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const client = await pool.connect();

    try {
      let query = `
        SELECT
          t.*,
          u.first_name || ' ' || u.last_name as captain_name,
          u.email as captain_email,
          COUNT(DISTINCT tm.user_id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.captain_id = u.id
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'accepted'
        WHERE 1=1
      `;
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND t.name ILIKE $${paramIndex}`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      query += ` GROUP BY t.id, u.first_name, u.last_name, u.email`;

      // Toplam sayı
      const countQuery = `
        SELECT COUNT(*) as total
        FROM teams t
        WHERE 1=1
        ${search ? `AND t.name ILIKE $1` : ''}
      `;
      const countResult = await client.query(
        countQuery,
        search ? [`%${search}%`] : []
      );
      const total = parseInt(countResult.rows[0].total);

      // Sayfalı veri
      query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(Number(limit), offset);

      const result = await client.query(query, queryParams);

      res.json({
        success: true,
        data: {
          teams: result.rows,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Takımlar alınırken bir hata oluştu',
    });
  }
};

// Takım detaylarını getir
export const getTeamDetails = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const client = await pool.connect();

    try {
      // Takım bilgisi
      const teamResult = await client.query(
        `SELECT
          t.*,
          u.first_name || ' ' || u.last_name as captain_name,
          u.email as captain_email
        FROM teams t
        LEFT JOIN users u ON t.captain_id = u.id
        WHERE t.id = $1`,
        [teamId]
      );

      if (teamResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı',
        });
      }

      // Takım üyeleri
      const membersResult = await client.query(
        `SELECT
          tm.*,
          u.first_name || ' ' || u.last_name as player_name,
          u.email as player_email,
          u.elo_rating,
          u.total_matches_played
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1
        ORDER BY tm.joined_at DESC`,
        [teamId]
      );

      res.json({
        success: true,
        data: {
          team: teamResult.rows[0],
          members: membersResult.rows,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım detayları alınırken bir hata oluştu',
    });
  }
};

// Takımı sil
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const client = await pool.connect();

    try {
      await client.query('DELETE FROM teams WHERE id = $1', [teamId]);

      res.json({
        success: true,
        message: 'Takım silindi',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım silinirken bir hata oluştu',
    });
  }
};
