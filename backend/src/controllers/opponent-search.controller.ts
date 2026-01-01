import { Request, Response } from 'express';
import { pool } from '../config/database';

// Rakip arama ilanı oluştur
export const createOpponentListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      title,
      description,
      preferredDateStart,
      preferredDateEnd,
      preferredTimes,
      city,
      district,
      preferredVenueIds,
      minEloRating,
      maxEloRating,
      matchType,
      fieldSize,
      matchDuration,
      costSharing,
      estimatedCost,
      additionalInfo,
      expiresAt,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını kontrol et (kaptan olmalı)
    const teamResult = await pool.query(
      `SELECT id, name FROM teams WHERE captain_id = $1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Rakip arama ilanı oluşturmak için takım kaptanı olmalısınız',
      });
    }

    const team = teamResult.rows[0];

    // Zorunlu alanları kontrol et
    if (!title || !preferredDateStart || !preferredDateEnd) {
      return res.status(400).json({
        success: false,
        message: 'Başlık, başlangıç ve bitiş tarihleri zorunludur',
      });
    }

    // İlan oluştur
    const result = await pool.query(
      `INSERT INTO opponent_search_listings (
        team_id, created_by_user_id, title, description,
        preferred_date_start, preferred_date_end, preferred_times,
        city, district, preferred_venue_ids,
        min_elo_rating, max_elo_rating,
        match_type, field_size, match_duration,
        cost_sharing, estimated_cost, additional_info, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        team.id,
        userId,
        title,
        description || null,
        preferredDateStart,
        preferredDateEnd,
        JSON.stringify(preferredTimes || []),
        city || null,
        district || null,
        JSON.stringify(preferredVenueIds || []),
        minEloRating || null,
        maxEloRating || null,
        matchType || 'friendly',
        fieldSize || null,
        matchDuration || 60,
        costSharing || 'split',
        estimatedCost || null,
        JSON.stringify(additionalInfo || {}),
        expiresAt || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Rakip arama ilanı başarıyla oluşturuldu',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create opponent listing error:', error);
    res.status(500).json({
      success: false,
      message: 'İlan oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

// Rakip arama ilanlarını listele (filtreleme ile)
export const searchOpponentListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      city,
      district,
      minElo,
      maxElo,
      dateStart,
      dateEnd,
      matchType,
      fieldSize,
      page = 1,
      limit = 20,
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını al
    const teamResult = await pool.query(
      `SELECT id, elo_rating FROM teams WHERE captain_id = $1
       UNION
       SELECT t.id, t.elo_rating FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [userId]
    );

    const userTeamId = teamResult.rows.length > 0 ? teamResult.rows[0].id : null;

    // Filtre koşullarını oluştur
    const conditions: string[] = ['osl.status = $1'];
    const params: any[] = ['active'];
    let paramIndex = 2;

    // Kendi takımının ilanlarını gösterme
    if (userTeamId) {
      conditions.push(`osl.team_id != $${paramIndex}`);
      params.push(userTeamId);
      paramIndex++;
    }

    if (city) {
      conditions.push(`osl.city = $${paramIndex}`);
      params.push(city);
      paramIndex++;
    }

    if (district) {
      conditions.push(`osl.district = $${paramIndex}`);
      params.push(district);
      paramIndex++;
    }

    if (minElo !== undefined) {
      conditions.push(`(t.elo_rating >= $${paramIndex} OR osl.min_elo_rating IS NULL)`);
      params.push(minElo);
      paramIndex++;
    }

    if (maxElo !== undefined) {
      conditions.push(`(t.elo_rating <= $${paramIndex} OR osl.max_elo_rating IS NULL)`);
      params.push(maxElo);
      paramIndex++;
    }

    if (dateStart) {
      conditions.push(`osl.preferred_date_end >= $${paramIndex}`);
      params.push(dateStart);
      paramIndex++;
    }

    if (dateEnd) {
      conditions.push(`osl.preferred_date_start <= $${paramIndex}`);
      params.push(dateEnd);
      paramIndex++;
    }

    if (matchType) {
      conditions.push(`osl.match_type = $${paramIndex}`);
      params.push(matchType);
      paramIndex++;
    }

    if (fieldSize) {
      conditions.push(`osl.field_size = $${paramIndex}`);
      params.push(fieldSize);
      paramIndex++;
    }

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause = conditions.join(' AND ');

    // İlanları getir
    const result = await pool.query(
      `SELECT
        osl.*,
        t.name as team_name,
        t.logo_url as team_logo,
        t.elo_rating as team_elo,
        t.total_matches as team_total_matches,
        u.first_name,
        u.last_name
       FROM opponent_search_listings osl
       JOIN teams t ON osl.team_id = t.id
       JOIN users u ON osl.created_by_user_id = u.id
       WHERE ${whereClause}
       ORDER BY osl.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    // Toplam sayıyı al
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM opponent_search_listings osl
       JOIN teams t ON osl.team_id = t.id
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        listings: result.rows.map(listing => ({
          id: listing.id,
          teamId: listing.team_id,
          teamName: listing.team_name,
          teamLogo: listing.team_logo,
          teamElo: listing.team_elo,
          teamTotalMatches: listing.team_total_matches,
          createdBy: {
            firstName: listing.first_name,
            lastName: listing.last_name,
          },
          title: listing.title,
          description: listing.description,
          preferredDateStart: listing.preferred_date_start,
          preferredDateEnd: listing.preferred_date_end,
          preferredTimes: listing.preferred_times,
          city: listing.city,
          district: listing.district,
          preferredVenueIds: listing.preferred_venue_ids,
          minEloRating: listing.min_elo_rating,
          maxEloRating: listing.max_elo_rating,
          matchType: listing.match_type,
          fieldSize: listing.field_size,
          matchDuration: listing.match_duration,
          costSharing: listing.cost_sharing,
          estimatedCost: listing.estimated_cost,
          additionalInfo: listing.additional_info,
          status: listing.status,
          createdAt: listing.created_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Search opponent listings error:', error);
    res.status(500).json({
      success: false,
      message: 'İlanlar aranırken hata oluştu',
      error: error.message,
    });
  }
};

// Kullanıcının kendi takımının rakip arama ilanlarını getir
export const getMyTeamListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını al
    const teamResult = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1
       UNION
       SELECT t.id FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const teamId = teamResult.rows[0].id;

    const result = await pool.query(
      `SELECT osl.*
       FROM opponent_search_listings osl
       WHERE osl.team_id = $1
       ORDER BY osl.created_at DESC`,
      [teamId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Get my team listings error:', error);
    res.status(500).json({
      success: false,
      message: 'İlanlar alınırken hata oluştu',
      error: error.message,
    });
  }
};

// İlanı güncelle
export const updateOpponentListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // İlanın sahibi mi kontrol et
    const listingResult = await pool.query(
      `SELECT osl.*, t.captain_id
       FROM opponent_search_listings osl
       JOIN teams t ON osl.team_id = t.id
       WHERE osl.id = $1`,
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'İlan bulunamadı',
      });
    }

    const listing = listingResult.rows[0];

    if (listing.captain_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu ilanı güncelleme yetkiniz yok',
      });
    }

    // Güncellenebilir alanlar
    const allowedFields = [
      'title',
      'description',
      'preferred_date_start',
      'preferred_date_end',
      'preferred_times',
      'city',
      'district',
      'min_elo_rating',
      'max_elo_rating',
      'match_type',
      'field_size',
      'match_duration',
      'cost_sharing',
      'estimated_cost',
      'status',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        updateValues.push(updateData[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı',
      });
    }

    updateValues.push(listingId);

    await pool.query(
      `UPDATE opponent_search_listings
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}`,
      updateValues
    );

    res.json({
      success: true,
      message: 'İlan başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Update opponent listing error:', error);
    res.status(500).json({
      success: false,
      message: 'İlan güncellenirken hata oluştu',
      error: error.message,
    });
  }
};

// İlanı sil
export const deleteOpponentListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // İlanın sahibi mi kontrol et
    const listingResult = await pool.query(
      `SELECT osl.*, t.captain_id
       FROM opponent_search_listings osl
       JOIN teams t ON osl.team_id = t.id
       WHERE osl.id = $1`,
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'İlan bulunamadı',
      });
    }

    const listing = listingResult.rows[0];

    if (listing.captain_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu ilanı silme yetkiniz yok',
      });
    }

    await pool.query(
      `DELETE FROM opponent_search_listings WHERE id = $1`,
      [listingId]
    );

    res.json({
      success: true,
      message: 'İlan başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Delete opponent listing error:', error);
    res.status(500).json({
      success: false,
      message: 'İlan silinirken hata oluştu',
      error: error.message,
    });
  }
};

// Maç teklifi gönder
export const createMatchProposal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      opponentListingId,
      targetTeamId,
      proposedDate,
      proposedTime,
      proposedVenueId,
      proposedFieldId,
      matchDuration,
      fieldSize,
      message,
      costSharing,
      estimatedCost,
      expiresAt,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını kontrol et (kaptan olmalı)
    const teamResult = await pool.query(
      `SELECT id, name FROM teams WHERE captain_id = $1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Maç teklifi göndermek için takım kaptanı olmalısınız',
      });
    }

    const proposingTeam = teamResult.rows[0];

    // Hedef takımı kontrol et
    if (!targetTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Hedef takım ID gereklidir',
      });
    }

    // Kendi takımına teklif gönderemez
    if (proposingTeam.id === targetTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Kendi takımınıza maç teklifi gönderemezsiniz',
      });
    }

    // Zorunlu alanları kontrol et
    if (!proposedDate || !proposedTime) {
      return res.status(400).json({
        success: false,
        message: 'Tarih ve saat bilgileri zorunludur',
      });
    }

    // Teklif oluştur
    const result = await pool.query(
      `INSERT INTO match_proposals (
        opponent_listing_id, proposing_team_id, proposed_by_user_id,
        target_team_id, proposed_date, proposed_time,
        proposed_venue_id, proposed_field_id, match_duration, field_size,
        message, cost_sharing, estimated_cost, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        opponentListingId || null,
        proposingTeam.id,
        userId,
        targetTeamId,
        proposedDate,
        proposedTime,
        proposedVenueId || null,
        proposedFieldId || null,
        matchDuration || 60,
        fieldSize || null,
        message || null,
        costSharing || 'split',
        estimatedCost || null,
        expiresAt || null,
      ]
    );

    const proposal = result.rows[0];

    // Hedef takımın kaptanına bildirim gönder
    const targetTeamResult = await pool.query(
      `SELECT captain_id, name FROM teams WHERE id = $1`,
      [targetTeamId]
    );

    if (targetTeamResult.rows.length > 0) {
      const targetTeam = targetTeamResult.rows[0];

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          targetTeam.captain_id,
          'match_proposal_received',
          'Yeni Maç Teklifi',
          `${proposingTeam.name} takımı size maç teklifi gönderdi!`,
          JSON.stringify({
            proposalId: proposal.id,
            proposingTeamId: proposingTeam.id,
            proposingTeamName: proposingTeam.name,
            proposedDate,
            proposedTime,
          }),
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Maç teklifi başarıyla gönderildi',
      data: proposal,
    });
  } catch (error: any) {
    console.error('Create match proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Maç teklifi gönderilirken hata oluştu',
      error: error.message,
    });
  }
};

// Maç tekliflerine yanıt ver (kabul/reddet)
export const respondToMatchProposal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { proposalId } = req.params;
    const { response: responseType, responseMessage } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Teklifi kontrol et
    const proposalResult = await pool.query(
      `SELECT mp.*, t.captain_id, t.name as target_team_name,
        pt.name as proposing_team_name
       FROM match_proposals mp
       JOIN teams t ON mp.target_team_id = t.id
       JOIN teams pt ON mp.proposing_team_id = pt.id
       WHERE mp.id = $1 AND mp.status = 'pending'`,
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maç teklifi bulunamadı veya zaten yanıtlandı',
      });
    }

    const proposal = proposalResult.rows[0];

    // Hedef takımın kaptanı mı kontrol et
    if (proposal.captain_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi yanıtlama yetkiniz yok',
      });
    }

    const newStatus = responseType === 'accepted' ? 'accepted' : 'rejected';

    // Teklifi güncelle
    await pool.query(
      `UPDATE match_proposals
       SET status = $1, response_message = $2, responded_by_user_id = $3, responded_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newStatus, responseMessage || null, userId, proposalId]
    );

    // Teklif gönderen takımın kaptanına bildirim gönder
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        proposal.proposed_by_user_id,
        newStatus === 'accepted' ? 'match_proposal_accepted' : 'match_proposal_rejected',
        newStatus === 'accepted' ? 'Maç Teklifi Kabul Edildi!' : 'Maç Teklifi Reddedildi',
        newStatus === 'accepted'
          ? `${proposal.target_team_name} takımı maç teklifinizi kabul etti!`
          : `${proposal.target_team_name} takımı maç teklifinizi reddetti.`,
        JSON.stringify({
          proposalId: proposal.id,
          targetTeamId: proposal.target_team_id,
          targetTeamName: proposal.target_team_name,
          proposedDate: proposal.proposed_date,
          proposedTime: proposal.proposed_time,
          responseMessage: responseMessage || null,
        }),
      ]
    );

    res.json({
      success: true,
      message: newStatus === 'accepted' ? 'Maç teklifi kabul edildi' : 'Maç teklifi reddedildi',
    });
  } catch (error: any) {
    console.error('Respond to match proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Maç teklifi yanıtlanırken hata oluştu',
      error: error.message,
    });
  }
};

// Gelen maç tekliflerini getir
export const getReceivedProposals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını al
    const teamResult = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1
       UNION
       SELECT t.id FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const teamId = teamResult.rows[0].id;

    const result = await pool.query(
      `SELECT
        mp.*,
        pt.name as proposing_team_name,
        pt.logo_url as proposing_team_logo,
        pt.elo_rating as proposing_team_elo,
        u.first_name as proposed_by_first_name,
        u.last_name as proposed_by_last_name,
        v.name as venue_name
       FROM match_proposals mp
       JOIN teams pt ON mp.proposing_team_id = pt.id
       JOIN users u ON mp.proposed_by_user_id = u.id
       LEFT JOIN venues v ON mp.proposed_venue_id = v.id
       WHERE mp.target_team_id = $1
       ORDER BY mp.created_at DESC`,
      [teamId]
    );

    res.json({
      success: true,
      data: result.rows.map(proposal => ({
        id: proposal.id,
        proposingTeamId: proposal.proposing_team_id,
        proposingTeamName: proposal.proposing_team_name,
        proposingTeamLogo: proposal.proposing_team_logo,
        proposingTeamElo: proposal.proposing_team_elo,
        proposedBy: {
          firstName: proposal.proposed_by_first_name,
          lastName: proposal.proposed_by_last_name,
        },
        proposedDate: proposal.proposed_date,
        proposedTime: proposal.proposed_time,
        venueName: proposal.venue_name,
        matchDuration: proposal.match_duration,
        fieldSize: proposal.field_size,
        message: proposal.message,
        costSharing: proposal.cost_sharing,
        estimatedCost: proposal.estimated_cost,
        status: proposal.status,
        responseMessage: proposal.response_message,
        respondedAt: proposal.responded_at,
        createdAt: proposal.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get received proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Maç teklifleri alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Gönderilen maç tekliflerini getir
export const getSentProposals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını al
    const teamResult = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1
       UNION
       SELECT t.id FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const teamId = teamResult.rows[0].id;

    const result = await pool.query(
      `SELECT
        mp.*,
        tt.name as target_team_name,
        tt.logo_url as target_team_logo,
        tt.elo_rating as target_team_elo,
        v.name as venue_name
       FROM match_proposals mp
       JOIN teams tt ON mp.target_team_id = tt.id
       LEFT JOIN venues v ON mp.proposed_venue_id = v.id
       WHERE mp.proposing_team_id = $1
       ORDER BY mp.created_at DESC`,
      [teamId]
    );

    res.json({
      success: true,
      data: result.rows.map(proposal => ({
        id: proposal.id,
        targetTeamId: proposal.target_team_id,
        targetTeamName: proposal.target_team_name,
        targetTeamLogo: proposal.target_team_logo,
        targetTeamElo: proposal.target_team_elo,
        proposedDate: proposal.proposed_date,
        proposedTime: proposal.proposed_time,
        venueName: proposal.venue_name,
        matchDuration: proposal.match_duration,
        fieldSize: proposal.field_size,
        message: proposal.message,
        costSharing: proposal.cost_sharing,
        estimatedCost: proposal.estimated_cost,
        status: proposal.status,
        responseMessage: proposal.response_message,
        respondedAt: proposal.responded_at,
        createdAt: proposal.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get sent proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Maç teklifleri alınırken hata oluştu',
      error: error.message,
    });
  }
};
