import { Request, Response } from 'express';
import { pool } from '../config/database';

// Rezervasyonları listele
export const getAllReservations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT
         r.id, r.field_id, r.user_id, r.reservation_date, r.start_time, r.end_time,
         r.status, r.payment_status, r.total_price, r.team_name, r.created_at,
         f.name as field_name, f.field_type,
         v.name as venue_name, v.address
       FROM reservations r
       JOIN fields f ON r.field_id = f.id
       JOIN venues v ON f.venue_id = v.id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date DESC, r.start_time DESC
       LIMIT 50`,
      [userId]
    );

    // Format data to match frontend expectations
    const formattedData = result.rows.map((row) => ({
      id: row.id,
      fieldId: row.field_id,
      userId: row.user_id,
      reservationDate: row.reservation_date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      paymentStatus: row.payment_status,
      totalPrice: row.total_price,
      teamName: row.team_name,
      createdAt: row.created_at,
      field: {
        name: row.field_name,
        fieldType: row.field_type,
      },
      venue: {
        name: row.venue_name,
        address: row.address,
      },
    }));

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: any) {
    console.error('Get all reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Rezervasyon detayı
export const getReservationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT r.*, f.name as field_name, v.name as venue_name, v.address
       FROM reservations r
       JOIN fields f ON r.field_id = f.id
       JOIN venues v ON f.venue_id = v.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon bilgisi alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Yeni rezervasyon oluştur
export const createReservation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.userId;
    const {
      fieldId,
      reservationDate,
      startTime,
      endTime,
      basePrice,
      totalPrice,
      teamName,
      teamId,
      playerIds, // Manuel eklenen oyuncular
    } = req.body;

    // Validation
    if (!fieldId || !reservationDate || !startTime || !endTime || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik',
      });
    }

    await client.query('BEGIN');

    // Tarih formatını kontrol et ve düzelt (timezone kayması önleme)
    // YYYY-MM-DD formatını garantilemek için
    let formattedDate = reservationDate;
    if (reservationDate.includes('T')) {
      // Eğer ISO string geldiyse, sadece tarih kısmını al
      formattedDate = reservationDate.split('T')[0];
    }

    // Rezervasyon oluştur
    const result = await client.query(
      `INSERT INTO reservations (
        field_id, user_id, reservation_date, start_time, end_time,
        base_price, total_price, team_name, team_id, status, payment_status
       )
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, 'pending', 'pending')
       RETURNING *`,
      [
        fieldId,
        userId,
        formattedDate,
        startTime,
        endTime,
        basePrice || totalPrice,
        totalPrice,
        teamName,
        teamId || null,
      ]
    );

    const reservationId = result.rows[0].id;

    // Eğer takım seçildiyse, takım üyelerini ve kaptanı ekle
    if (teamId) {
      // Takım bilgisini al (kaptanı bulmak için)
      const teamInfo = await client.query(
        `SELECT captain_id FROM teams WHERE id = $1`,
        [teamId]
      );

      if (teamInfo.rows.length > 0) {
        const captainId = teamInfo.rows[0].captain_id;

        // Takım kaptanını ekle
        await client.query(
          `INSERT INTO reservation_players (reservation_id, user_id, added_via, team_id)
           VALUES ($1, $2, 'team', $3)
           ON CONFLICT (reservation_id, user_id) DO NOTHING`,
          [reservationId, captainId, teamId]
        );

        // Takım üyelerini ekle
        const teamMembers = await client.query(
          `SELECT user_id FROM team_members WHERE team_id = $1 AND status = 'active'`,
          [teamId]
        );

        for (const member of teamMembers.rows) {
          await client.query(
            `INSERT INTO reservation_players (reservation_id, user_id, added_via, team_id)
             VALUES ($1, $2, 'team', $3)
             ON CONFLICT (reservation_id, user_id) DO NOTHING`,
            [reservationId, member.user_id, teamId]
          );
        }
      }
    }

    // Manuel eklenen oyuncuları ekle
    if (playerIds && Array.isArray(playerIds) && playerIds.length > 0) {
      for (const playerId of playerIds) {
        await client.query(
          `INSERT INTO reservation_players (reservation_id, user_id, added_via)
           VALUES ($1, $2, 'manual')
           ON CONFLICT (reservation_id, user_id) DO NOTHING`,
          [reservationId, playerId]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Rezervasyon başarıyla oluşturuldu',
      data: result.rows[0],
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create reservation error:', error);

    // Çifte rezervasyon hatası
    if (error.code === '23P01') {
      return res.status(409).json({
        success: false,
        message: 'Bu saat aralığı için zaten bir rezervasyon bulunmaktadır',
        error: 'OVERLAPPING_RESERVATION',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Rezervasyon oluşturulurken hata oluştu',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Saha için müsait saatleri getir
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { fieldId, date } = req.query;

    if (!fieldId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Saha ID ve tarih gereklidir',
      });
    }

    // Tarih formatını düzelt (timezone kayması önleme)
    let formattedDate = date as string;
    if (formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }

    // O tarih için var olan rezervasyonları getir
    const result = await pool.query(
      `SELECT start_time, end_time
       FROM reservations
       WHERE field_id = $1
         AND reservation_date = $2::date
         AND status NOT IN ('cancelled', 'no_show')
       ORDER BY start_time`,
      [fieldId, formattedDate]
    );

    // Format data to camelCase
    const bookedSlots = result.rows.map(row => ({
      startTime: row.start_time,
      endTime: row.end_time,
    }));

    res.json({
      success: true,
      data: {
        date,
        bookedSlots,
      },
    });
  } catch (error: any) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Müsait saatler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Rezervasyonu iptal et
export const cancelReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Rezervasyonu bul ve kullanıcıya ait olduğunu kontrol et
    const checkResult = await pool.query(
      `SELECT * FROM reservations
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı veya bu rezervasyon size ait değil',
      });
    }

    const reservation = checkResult.rows[0];

    // İptal edilebilir durumda olup olmadığını kontrol et
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Bu rezervasyon zaten iptal edilmiş',
      });
    }

    if (reservation.status === 'completed' || reservation.status === 'no_show') {
      return res.status(400).json({
        success: false,
        message: 'Tamamlanmış veya geçmiş rezervasyonlar iptal edilemez',
      });
    }

    // Rezervasyonu iptal et
    const result = await pool.query(
      `UPDATE reservations
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Rezervasyon başarıyla iptal edildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon iptal edilirken hata oluştu',
      error: error.message,
    });
  }
};

// Rezervasyondaki oyuncuları getir
export const getReservationPlayers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Rezervasyonun var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const reservationCheck = await pool.query(
      `SELECT * FROM reservations WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (reservationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı veya size ait değil',
      });
    }

    // Rezervasyondaki oyuncuları getir (rezervasyon yapan hariç)
    const players = await pool.query(
      `SELECT DISTINCT
        u.id as "userId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.profile_data as "profilePicture",
        u.trust_score as "trustScore"
       FROM reservation_players rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.reservation_id = $1 AND rp.user_id != $2
       ORDER BY u.first_name, u.last_name`,
      [id, userId]
    );

    res.json({
      success: true,
      data: players.rows,
    });
  } catch (error: any) {
    console.error('Get reservation players error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncular alınırken hata oluştu',
      error: error.message,
    });
  }
};
