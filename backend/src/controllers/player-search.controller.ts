import { Request, Response } from 'express';
import { pool } from '../config/database';

// Tüm aktif oyuncu aramalarını listele
export const getAllPlayerSearches = async (req: Request, res: Response) => {
  try {
    const { city, district, skillLevel, playerPosition } = req.query;

    let query = `
      SELECT
        ps.*,
        u.first_name || ' ' || u.last_name as organizer_name,
        u.elo_rating as organizer_elo,
        v.name as venue_name,
        v.city,
        v.district,
        v.address,
        f.name as field_name,
        f.field_type,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.team_name,
        COALESCE(
          (SELECT COUNT(*)
           FROM player_search_participants
           WHERE listing_id = ps.id AND status = 'accepted'),
          0
        ) as joined_count
      FROM player_search_listings ps
      JOIN users u ON ps.organizer_id = u.id
      JOIN reservations r ON ps.reservation_id = r.id
      LEFT JOIN fields f ON ps.field_id = f.id
      LEFT JOIN venues v ON f.venue_id = v.id
      WHERE ps.status = 'open'
        AND r.reservation_date >= CURRENT_DATE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (city) {
      query += ` AND v.city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    if (district) {
      query += ` AND v.district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (skillLevel) {
      query += ` AND ps.preferred_skill_level = $${paramIndex}`;
      params.push(skillLevel);
      paramIndex++;
    }

    if (playerPosition) {
      query += ` AND $${paramIndex} = ANY(ps.preferred_positions)`;
      params.push(playerPosition);
      paramIndex++;
    }

    query += ` ORDER BY r.reservation_date ASC, r.start_time ASC LIMIT 50`;

    const result = await pool.query(query, params);

    const formattedData = result.rows.map((row) => ({
      id: row.id,
      userId: row.organizer_id,
      fieldId: row.field_id,
      matchDate: row.reservation_date,
      matchTime: row.start_time,
      playersNeeded: row.players_needed,
      preferredSkillLevel: row.preferred_skill_level,
      preferredPositions: row.preferred_positions,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      organizerName: row.organizer_name,
      organizerElo: row.organizer_elo,
      joinedCount: parseInt(row.joined_count) || 0,
      teamName: row.team_name,
      venue: row.venue_name ? {
        name: row.venue_name,
        city: row.city,
        district: row.district,
        address: row.address,
      } : null,
      field: row.field_name ? {
        name: row.field_name,
        fieldType: row.field_type,
      } : null,
    }));

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: any) {
    console.error('Get all player searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncu aramaları alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Kullanıcının kendi oyuncu aramalarını listele
export const getMyPlayerSearches = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT
        ps.*,
        v.name as venue_name,
        v.city,
        v.district,
        f.name as field_name,
        f.field_type,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.team_name,
        COALESCE(
          (SELECT COUNT(*)
           FROM player_search_participants
           WHERE listing_id = ps.id AND status = 'accepted'),
          0
        ) as joined_count
      FROM player_search_listings ps
      JOIN reservations r ON ps.reservation_id = r.id
      LEFT JOIN fields f ON ps.field_id = f.id
      LEFT JOIN venues v ON f.venue_id = v.id
      WHERE ps.organizer_id = $1
      ORDER BY r.reservation_date DESC, r.start_time DESC
      LIMIT 50`,
      [userId]
    );

    const formattedData = result.rows.map((row) => ({
      id: row.id,
      userId: row.organizer_id,
      fieldId: row.field_id,
      matchDate: row.reservation_date,
      matchTime: row.start_time,
      playersNeeded: row.players_needed,
      preferredSkillLevel: row.preferred_skill_level,
      preferredPositions: row.preferred_positions,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      joinedCount: parseInt(row.joined_count) || 0,
      teamName: row.team_name,
      venue: row.venue_name ? {
        name: row.venue_name,
        city: row.city,
        district: row.district,
      } : null,
      field: row.field_name ? {
        name: row.field_name,
        fieldType: row.field_type,
      } : null,
    }));

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: any) {
    console.error('Get my player searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Aramalarınız alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Oyuncu arama detayı
export const getPlayerSearchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        ps.*,
        u.first_name || ' ' || u.last_name as organizer_name,
        u.elo_rating as organizer_elo,
        u.phone as organizer_phone,
        v.name as venue_name,
        v.city,
        v.district,
        v.address,
        f.name as field_name,
        f.field_type
      FROM player_search_listings ps
      JOIN users u ON ps.organizer_id = u.id
      LEFT JOIN fields f ON ps.field_id = f.id
      LEFT JOIN venues v ON f.venue_id = v.id
      WHERE ps.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oyuncu araması bulunamadı',
      });
    }

    // Katılımcıları getir
    const participantsResult = await pool.query(
      `SELECT
        psp.*,
        u.first_name || ' ' || u.last_name as player_name,
        u.elo_rating as player_elo,
        u.profile_data->>'preferredPosition' as preferred_position
      FROM player_search_participants psp
      JOIN users u ON psp.user_id = u.id
      WHERE psp.listing_id = $1
      ORDER BY psp.created_at ASC`,
      [id]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        id: row.id,
        userId: row.organizer_id,
        fieldId: row.field_id,
        matchDate: row.match_date,
        matchTime: row.match_time,
        playersNeeded: row.players_needed,
        preferredSkillLevel: row.preferred_skill_level,
        preferredPositions: row.preferred_positions,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        organizer: {
          name: row.organizer_name,
          elo: row.organizer_elo,
          phone: row.organizer_phone,
        },
        venue: row.venue_name ? {
          name: row.venue_name,
          city: row.city,
          district: row.district,
          address: row.address,
        } : null,
        field: row.field_name ? {
          name: row.field_name,
          fieldType: row.field_type,
        } : null,
        participants: participantsResult.rows.map((p) => ({
          id: p.id,
          userId: p.user_id,
          status: p.status,
          playerName: p.player_name,
          playerElo: p.player_elo,
          preferredPosition: p.preferred_position,
          createdAt: p.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get player search by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncu araması alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Yeni oyuncu araması oluştur
export const createPlayerSearch = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      reservationId,
      playersNeeded,
      preferredSkillLevel,
      preferredPositions,
      description,
    } = req.body;

    // Validation
    if (!reservationId || !playersNeeded || !description) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik (rezervasyon, oyuncu sayısı, açıklama)',
      });
    }

    if (playersNeeded < 1 || playersNeeded > 22) {
      return res.status(400).json({
        success: false,
        message: 'Oyuncu sayısı 1-22 arasında olmalıdır',
      });
    }

    // Rezervasyonu kontrol et ve bilgilerini al
    const reservationResult = await pool.query(
      `SELECT r.*, f.venue_id
       FROM reservations r
       JOIN fields f ON r.field_id = f.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [reservationId, userId]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı veya size ait değil',
      });
    }

    const reservation = reservationResult.rows[0];

    // Rezervasyon durumunu kontrol et
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'İptal edilmiş rezervasyon için oyuncu araması oluşturamazsınız',
      });
    }

    // Geçmiş rezervasyon kontrolü
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.end_time}`);
    if (reservationDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Geçmiş rezervasyon için oyuncu araması oluşturamazsınız',
      });
    }

    // Bu rezervasyon için zaten arama var mı kontrol et
    const existingSearch = await pool.query(
      `SELECT * FROM player_search_listings WHERE reservation_id = $1 AND status = 'open'`,
      [reservationId]
    );

    if (existingSearch.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu rezervasyon için zaten aktif bir oyuncu araması var',
      });
    }

    const result = await pool.query(
      `INSERT INTO player_search_listings (
        organizer_id, reservation_id, field_id, venue_id,
        match_date, match_time, players_needed,
        preferred_skill_level, preferred_positions, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')
      RETURNING *`,
      [
        userId,
        reservationId,
        reservation.field_id,
        reservation.venue_id,
        reservation.reservation_date,
        reservation.start_time,
        playersNeeded,
        preferredSkillLevel || null,
        preferredPositions || [],
        description,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Oyuncu araması başarıyla oluşturuldu',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create player search error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncu araması oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

// Oyuncu aramasına katıl
export const joinPlayerSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { message } = req.body;

    // Aramayı kontrol et
    const searchResult = await pool.query(
      `SELECT * FROM player_search_listings WHERE id = $1`,
      [id]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oyuncu araması bulunamadı',
      });
    }

    const search = searchResult.rows[0];

    if (search.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Bu arama artık aktif değil',
      });
    }

    if (search.organizer_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Kendi aramanıza katılamazsınız',
      });
    }

    // Daha önce katılmış mı kontrol et
    const existingParticipant = await pool.query(
      `SELECT * FROM player_search_participants
       WHERE listing_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu aramaya zaten katıldınız',
      });
    }

    // Katılımcı sayısını kontrol et
    const participantCount = await pool.query(
      `SELECT COUNT(*) as count FROM player_search_participants
       WHERE listing_id = $1 AND status = 'accepted'`,
      [id]
    );

    if (parseInt(participantCount.rows[0].count) >= search.players_needed) {
      return res.status(400).json({
        success: false,
        message: 'Bu arama için yeterli oyuncu bulundu',
      });
    }

    // Katılım isteği oluştur (pending olarak)
    const result = await pool.query(
      `INSERT INTO player_search_participants (listing_id, user_id, status, message)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [id, userId, message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Katılım isteğiniz gönderildi. Organizatör inceleyip size dönüş yapacaktır.',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Join player search error:', error);
    res.status(500).json({
      success: false,
      message: 'Aramaya katılırken hata oluştu',
      error: error.message,
    });
  }
};

// Oyuncu aramasından ayrıl
export const leavePlayerSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Katılımcıyı kontrol et
    const participantResult = await pool.query(
      `SELECT * FROM player_search_participants
       WHERE listing_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu aramaya katılmadınız',
      });
    }

    // Katılımcıyı sil
    await pool.query(
      `DELETE FROM player_search_participants
       WHERE listing_id = $1 AND user_id = $2`,
      [id, userId]
    );

    // Aramayı tekrar aktif yap
    await pool.query(
      `UPDATE player_search_listings
       SET status = 'open'
       WHERE id = $1 AND status = 'filled'`,
      [id]
    );

    res.json({
      success: true,
      message: 'Aramadan başarıyla ayrıldınız',
    });
  } catch (error: any) {
    console.error('Leave player search error:', error);
    res.status(500).json({
      success: false,
      message: 'Aramadan ayrılırken hata oluştu',
      error: error.message,
    });
  }
};

// Rezervasyon için bekleyen katılım isteklerini getir
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.userId;

    // Önce bu rezervasyona ait oyuncu aramasını bul
    const searchResult = await pool.query(
      `SELECT * FROM player_search_listings
       WHERE reservation_id = $1 AND organizer_id = $2`,
      [reservationId, userId]
    );

    if (searchResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const listingId = searchResult.rows[0].id;

    // Bekleyen istekleri getir
    const result = await pool.query(
      `SELECT
        psp.*,
        u.first_name || ' ' || u.last_name as player_name,
        u.email,
        u.phone,
        u.elo_rating,
        u.profile_data
      FROM player_search_participants psp
      JOIN users u ON psp.user_id = u.id
      WHERE psp.listing_id = $1
      ORDER BY
        CASE psp.status
          WHEN 'pending' THEN 1
          WHEN 'accepted' THEN 2
          WHEN 'rejected' THEN 3
        END,
        psp.created_at ASC`,
      [listingId]
    );

    const formattedData = result.rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      userId: row.user_id,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      user: {
        name: row.player_name,
        email: row.email,
        phone: row.phone,
        elo: row.elo_rating,
        profileData: row.profile_data,
      },
    }));

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'İstekler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Katılım isteğini kabul et
export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    // İsteği ve aramayı kontrol et
    const requestResult = await pool.query(
      `SELECT psp.*, psl.organizer_id, psl.players_needed, psl.id as listing_id, psl.reservation_id
       FROM player_search_participants psp
       JOIN player_search_listings psl ON psp.listing_id = psl.id
       WHERE psp.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'İstek bulunamadı',
      });
    }

    const request = requestResult.rows[0];

    // Kullanıcı organizatör mü kontrol et
    if (request.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu isteği onaylama yetkiniz yok',
      });
    }

    // İstek zaten işlenmiş mi kontrol et
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu istek zaten işlenmiş',
      });
    }

    // Kabul edilen oyuncu sayısını kontrol et
    const acceptedCount = await pool.query(
      `SELECT COUNT(*) as count FROM player_search_participants
       WHERE listing_id = $1 AND status = 'accepted'`,
      [request.listing_id]
    );

    const currentAccepted = parseInt(acceptedCount.rows[0].count);

    // İsteği kabul et
    const result = await pool.query(
      `UPDATE player_search_participants
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId]
    );

    // Kabul edilen oyuncuyu reservation_players tablosuna ekle
    if (request.reservation_id) {
      await pool.query(
        `INSERT INTO reservation_players (reservation_id, user_id, added_via)
         VALUES ($1, $2, 'player_search')
         ON CONFLICT (reservation_id, user_id) DO NOTHING`,
        [request.reservation_id, request.user_id]
      );
    }

    // Eğer yeterli oyuncu bulunduysa aramayı kapat
    if (currentAccepted + 1 >= request.players_needed) {
      await pool.query(
        `UPDATE player_search_listings SET status = 'filled' WHERE id = $1`,
        [request.listing_id]
      );
    }

    res.json({
      success: true,
      message: 'Katılım isteği kabul edildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'İstek kabul edilirken hata oluştu',
      error: error.message,
    });
  }
};

// Katılım isteğini reddet
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId;

    // İsteği ve aramayı kontrol et
    const requestResult = await pool.query(
      `SELECT psp.*, psl.organizer_id
       FROM player_search_participants psp
       JOIN player_search_listings psl ON psp.listing_id = psl.id
       WHERE psp.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'İstek bulunamadı',
      });
    }

    const request = requestResult.rows[0];

    // Kullanıcı organizatör mü kontrol et
    if (request.organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu isteği reddetme yetkiniz yok',
      });
    }

    // İstek zaten işlenmiş mi kontrol et
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu istek zaten işlenmiş',
      });
    }

    // İsteği reddet
    const result = await pool.query(
      `UPDATE player_search_participants
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId]
    );

    res.json({
      success: true,
      message: 'Katılım isteği reddedildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'İstek reddedilirken hata oluştu',
      error: error.message,
    });
  }
};

// Oyuncu aramasını iptal et
export const cancelPlayerSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Aramayı kontrol et
    const searchResult = await pool.query(
      `SELECT * FROM player_search_listings WHERE id = $1 AND organizer_id = $2`,
      [id, userId]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oyuncu araması bulunamadı veya size ait değil',
      });
    }

    const search = searchResult.rows[0];

    if (search.status === 'closed' || search.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Bu arama zaten kapatılmış',
      });
    }

    // Aramayı iptal et
    const result = await pool.query(
      `UPDATE player_search_listings
       SET status = 'closed', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Oyuncu araması başarıyla iptal edildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Cancel player search error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncu araması iptal edilirken hata oluştu',
      error: error.message,
    });
  }
};
