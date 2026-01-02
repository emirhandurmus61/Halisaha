import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

// Kullanıcının takımını getir
export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını bul (üye olduğu veya kaptan olduğu)
    const teamResult = await pool.query(
      `SELECT DISTINCT t.*
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.captain_id = $1 OR tm.user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Henüz bir takıma üye değilsiniz',
      });
    }

    const team = teamResult.rows[0];

    // Takım üyelerini getir
    const membersResult = await pool.query(
      `SELECT
        tm.*,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.profile_data,
        u.elo_rating,
        u.total_matches_played,
        u.trust_score
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1 AND tm.status = 'active'
       ORDER BY
         CASE WHEN tm.role = 'captain' THEN 1
              WHEN tm.role = 'co-captain' THEN 2
              ELSE 3
         END,
         tm.joined_at ASC`,
      [team.id]
    );

    // Takım istatistikleri
    const stats = {
      totalMatches: team.total_matches || 0,
      totalWins: team.total_wins || 0,
      totalDraws: team.total_draws || 0,
      totalLosses: team.total_losses || 0,
      eloRating: team.elo_rating || 1000,
      winRate: team.total_matches > 0
        ? ((team.total_wins / team.total_matches) * 100).toFixed(1)
        : '0.0',
      memberCount: membersResult.rows.length,
    };

    res.json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          logoUrl: team.logo_url,
          description: team.description,
          captainId: team.captain_id,
          isPublic: team.is_public,
          allowJoinRequests: team.allow_join_requests,
          createdAt: team.created_at,
        },
        members: membersResult.rows.map(member => ({
          id: member.id,
          userId: member.user_id,
          email: member.email,
          firstName: member.first_name,
          lastName: member.last_name,
          profilePicture: member.profile_data?.profilePicture,
          role: member.role,
          position: member.position,
          jerseyNumber: member.jersey_number,
          matchesPlayed: member.matches_played || 0,
          goalsScored: member.goals_scored || 0,
          assists: member.assists || 0,
          eloRating: member.elo_rating || 1000,
          totalMatchesPlayed: member.total_matches_played || 0,
          trustScore: member.trust_score || 100,
          joinedAt: member.joined_at,
        })),
        stats,
      },
    });
  } catch (error: any) {
    console.error('Get my team error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım bilgisi alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Takım oluştur
export const createTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, description, logoUrl } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Takım adı gereklidir',
      });
    }

    // Kullanıcının zaten bir takımı var mı kontrol et
    const existingTeamCheck = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1
       UNION
       SELECT team_id as id FROM team_members WHERE user_id = $1 AND status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (existingTeamCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Zaten bir takımınız var',
      });
    }

    // Slug oluştur
    const slug = name.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Takımı oluştur
    const result = await pool.query(
      `INSERT INTO teams (captain_id, name, slug, description, logo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, slug + '-' + Date.now(), description || null, logoUrl || null]
    );

    const team = result.rows[0];

    // Kaptanı takım üyesi olarak ekle
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'captain')`,
      [team.id, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Takım başarıyla oluşturuldu',
      data: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
    });
  } catch (error: any) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};

// Oyuncu ara (username ile)
export const searchPlayers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { username } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı gereklidir',
      });
    }

    // Kullanıcı adına göre oyuncuları ara (kendi takımında olmayanlar)
    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_data,
        u.elo_rating,
        u.total_matches_played,
        u.trust_score,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.user_id = u.id AND tm.status = 'active'
          ) THEN true
          ELSE false
        END as has_team
       FROM users u
       WHERE u.username ILIKE $1 AND u.id != $2
       LIMIT 10`,
      [`%${username}%`, userId]
    );

    res.json({
      success: true,
      data: result.rows.map(player => ({
        id: player.id,
        username: player.username,
        firstName: player.first_name,
        lastName: player.last_name,
        email: player.email,
        profilePicture: player.profile_data?.profilePicture,
        eloRating: player.elo_rating || 1000,
        totalMatchesPlayed: player.total_matches_played || 0,
        trustScore: player.trust_score || 100,
        hasTeam: player.has_team,
      })),
    });
  } catch (error: any) {
    console.error('Search players error:', error);
    res.status(500).json({
      success: false,
      message: 'Oyuncu arama hatası',
      error: error.message,
    });
  }
};

// Takıma davet gönder
export const invitePlayer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { playerId, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'Oyuncu ID gereklidir',
      });
    }

    // Kullanıcının takımını bul (kaptan olmalı)
    const teamResult = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Sadece takım kaptanları davet gönderebilir',
      });
    }

    const teamId = teamResult.rows[0].id;

    // Oyuncunun zaten bir takımı var mı kontrol et
    const playerTeamCheck = await pool.query(
      `SELECT id FROM teams WHERE captain_id = $1
       UNION
       SELECT team_id as id FROM team_members WHERE user_id = $1 AND status = 'active'
       LIMIT 1`,
      [playerId]
    );

    if (playerTeamCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu oyuncunun zaten bir takımı var',
      });
    }

    // Daha önce davet gönderilmiş mi kontrol et
    const existingInvitation = await pool.query(
      `SELECT id, status FROM team_invitations
       WHERE team_id = $1 AND invited_user_id = $2 AND status = 'pending'`,
      [teamId, playerId]
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu oyuncuya zaten bekleyen bir davetiniz var',
      });
    }

    // Davet oluştur
    const result = await pool.query(
      `INSERT INTO team_invitations (team_id, invited_user_id, invited_by_user_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, playerId, userId, message || null]
    );

    res.status(201).json({
      success: true,
      message: 'Davet başarıyla gönderildi',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Invite player error:', error);
    res.status(500).json({
      success: false,
      message: 'Davet gönderme hatası',
      error: error.message,
    });
  }
};

// Kullanıcının davetlerini getir
export const getMyInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    const result = await pool.query(
      `SELECT
        ti.*,
        t.name as team_name,
        t.logo_url as team_logo,
        t.description as team_description,
        u.username as invited_by_username,
        u.first_name as invited_by_first_name,
        u.last_name as invited_by_last_name
       FROM team_invitations ti
       JOIN teams t ON ti.team_id = t.id
       JOIN users u ON ti.invited_by_user_id = u.id
       WHERE ti.invited_user_id = $1 AND ti.status = 'pending'
       ORDER BY ti.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(inv => ({
        id: inv.id,
        teamId: inv.team_id,
        teamName: inv.team_name,
        teamLogo: inv.team_logo,
        teamDescription: inv.team_description,
        message: inv.message,
        invitedBy: {
          username: inv.invited_by_username,
          firstName: inv.invited_by_first_name,
          lastName: inv.invited_by_last_name,
        },
        createdAt: inv.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Davetler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Davete yanıt ver (kabul/reddet)
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { invitationId } = req.params;
    const { accept } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    if (accept === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Kabul/Red bilgisi gereklidir',
      });
    }

    // Daveti kontrol et
    const invitationResult = await pool.query(
      `SELECT * FROM team_invitations WHERE id = $1 AND invited_user_id = $2 AND status = 'pending'`,
      [invitationId, userId]
    );

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Davet bulunamadı veya zaten yanıtlandı',
      });
    }

    const invitation = invitationResult.rows[0];

    if (accept) {
      // Kullanıcının başka bir takımı var mı kontrol et
      const existingTeamCheck = await pool.query(
        `SELECT id FROM teams WHERE captain_id = $1
         UNION
         SELECT team_id as id FROM team_members WHERE user_id = $1 AND status = 'active'
         LIMIT 1`,
        [userId]
      );

      if (existingTeamCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Zaten bir takımınız var',
        });
      }

      // Takıma ekle
      await pool.query(
        `INSERT INTO team_members (team_id, user_id, role, status)
         VALUES ($1, $2, 'member', 'active')`,
        [invitation.team_id, userId]
      );

      // Daveti kabul edildi olarak işaretle
      await pool.query(
        `UPDATE team_invitations SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [invitationId]
      );

      // Davet gönderen kişiye bildirim gönder
      const userResult = await pool.query(
        `SELECT first_name, last_name FROM users WHERE id = $1`,
        [userId]
      );
      const teamResult = await pool.query(
        `SELECT name FROM teams WHERE id = $1`,
        [invitation.team_id]
      );

      if (userResult.rows.length > 0 && teamResult.rows.length > 0) {
        const user = userResult.rows[0];
        const team = teamResult.rows[0];

        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            invitation.invited_by_user_id,
            'team_invitation_accepted',
            'Davet Kabul Edildi',
            `${user.first_name} ${user.last_name}, ${team.name} takımına katılma davetinizi kabul etti!`,
            JSON.stringify({
              teamId: invitation.team_id,
              teamName: team.name,
              userId: userId,
              userName: `${user.first_name} ${user.last_name}`
            })
          ]
        );
      }

      res.json({
        success: true,
        message: 'Takıma başarıyla katıldınız',
      });
    } else {
      // Daveti reddet
      await pool.query(
        `UPDATE team_invitations SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [invitationId]
      );

      // Davet gönderen kişiye bildirim gönder
      const userResult = await pool.query(
        `SELECT first_name, last_name FROM users WHERE id = $1`,
        [userId]
      );
      const teamResult = await pool.query(
        `SELECT name FROM teams WHERE id = $1`,
        [invitation.team_id]
      );

      if (userResult.rows.length > 0 && teamResult.rows.length > 0) {
        const user = userResult.rows[0];
        const team = teamResult.rows[0];

        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            invitation.invited_by_user_id,
            'team_invitation_rejected',
            'Davet Reddedildi',
            `${user.first_name} ${user.last_name}, ${team.name} takımına katılma davetinizi reddetti.`,
            JSON.stringify({
              teamId: invitation.team_id,
              teamName: team.name,
              userId: userId,
              userName: `${user.first_name} ${user.last_name}`
            })
          ]
        );
      }

      res.json({
        success: true,
        message: 'Davet reddedildi',
      });
    }
  } catch (error: any) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Davet yanıtlama hatası',
      error: error.message,
    });
  }
};

// Takım bilgilerini güncelle
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { description } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını kontrol et (kaptan olmalı)
    const teamResult = await pool.query(
      `SELECT id, logo_url FROM teams WHERE captain_id = $1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Sadece takım kaptanları takım bilgilerini güncelleyebilir',
      });
    }

    const team = teamResult.rows[0];

    // Takım bilgilerini güncelle
    await pool.query(
      `UPDATE teams SET description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [description || null, team.id]
    );

    res.json({
      success: true,
      message: 'Takım bilgileri başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım güncelleme hatası',
      error: error.message,
    });
  }
};

// Takım logosunu güncelle
export const updateTeamLogo = async (req: Request, res: Response) => {
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
        message: 'Logo dosyası gereklidir',
      });
    }

    // Kullanıcının takımını kontrol et (kaptan olmalı)
    const teamResult = await pool.query(
      `SELECT id, logo_url FROM teams WHERE captain_id = $1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Sadece takım kaptanları logoyu güncelleyebilir',
      });
    }

    const team = teamResult.rows[0];

    // Eski logoyu sil
    if (team.logo_url) {
      const oldLogoPath = path.join(__dirname, '../../', team.logo_url);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Yeni logo yolunu kaydet
    const logoUrl = `/uploads/team-logos/${req.file.filename}`;
    await pool.query(
      `UPDATE teams SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [logoUrl, team.id]
    );

    res.json({
      success: true,
      message: 'Takım logosu başarıyla güncellendi',
      data: { logoUrl },
    });
  } catch (error: any) {
    console.error('Update team logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Logo güncelleme hatası',
      error: error.message,
    });
  }
};

// Kullanıcının bildirimlerini getir
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data,
        isRead: notif.is_read,
        createdAt: notif.created_at,
        readAt: notif.read_at,
      })),
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim güncellenirken hata oluştu',
      error: error.message,
    });
  }
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi',
    });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler güncellenirken hata oluştu',
      error: error.message,
    });
  }
};

// Takımın maçlarını (rezervasyonlarını) getir
export const getTeamMatches = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

    // Kullanıcının takımını bul
    const teamResult = await pool.query(
      `SELECT DISTINCT t.id
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.captain_id = $1 OR tm.user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı',
      });
    }

    const teamId = teamResult.rows[0].id;

    // Takımın rezervasyonlarını getir
    const matchesResult = await pool.query(
      `SELECT
        r.id,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.payment_status,
        r.total_price,
        r.team_name,
        r.created_at,
        f.name as field_name,
        f.field_type,
        v.name as venue_name,
        v.address,
        v.city,
        COUNT(DISTINCT rp.user_id) as player_count
       FROM reservations r
       JOIN fields f ON r.field_id = f.id
       JOIN venues v ON f.venue_id = v.id
       LEFT JOIN reservation_players rp ON r.id = rp.reservation_id
       WHERE r.team_id = $1
       GROUP BY r.id, f.id, f.name, f.field_type, v.name, v.address, v.city
       ORDER BY r.reservation_date DESC, r.start_time DESC`,
      [teamId]
    );

    // Geçmiş ve gelecek maçları ayır
    const now = new Date();
    const upcomingMatches: any[] = [];
    const pastMatches: any[] = [];

    matchesResult.rows.forEach((match) => {
      // Tarihi YYYY-MM-DD formatında garanti et
      let reservationDate = match.reservation_date;
      if (reservationDate && typeof reservationDate === 'object') {
        // PostgreSQL Date object ise string'e çevir
        reservationDate = reservationDate.toISOString().split('T')[0];
      } else if (typeof reservationDate === 'string' && reservationDate.includes('T')) {
        // ISO string ise sadece tarih kısmını al
        reservationDate = reservationDate.split('T')[0];
      }

      // Tarih ve saati local timezone'da doğru parse et
      // YYYY-MM-DD formatındaki tarihi parse et
      const [year, month, day] = reservationDate.split('-').map(Number);
      const [hours, minutes] = match.end_time.split(':').map(Number);

      // Local timezone'da tarih oluştur (UTC değil!)
      const matchDateTime = new Date(year, month - 1, day, hours, minutes, 0);

      const formattedMatch = {
        id: match.id,
        reservationDate: reservationDate,
        startTime: match.start_time,
        endTime: match.end_time,
        status: match.status,
        paymentStatus: match.payment_status,
        totalPrice: match.total_price,
        teamName: match.team_name,
        createdAt: match.created_at,
        playerCount: parseInt(match.player_count || '0'),
        field: {
          name: match.field_name,
          fieldType: match.field_type,
        },
        venue: {
          name: match.venue_name,
          address: match.address,
          city: match.city,
        },
      };

      // Debug log
      console.log('Match:', reservationDate, match.start_time, '-', match.end_time,
                  '| MatchTime:', matchDateTime.toISOString(),
                  '| Now:', now.toISOString(),
                  '| Future?', matchDateTime > now, '| Status:', match.status);

      if (matchDateTime > now) {
        upcomingMatches.push(formattedMatch);
      } else {
        pastMatches.push(formattedMatch);
      }
    });

    // Gelecek maçları tarihe göre sırala (yakından uzağa)
    upcomingMatches.sort((a, b) => {
      const dateA = new Date(`${a.reservationDate}T${a.startTime}`);
      const dateB = new Date(`${b.reservationDate}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Geçmiş maçları ters sırala (yeniden eskiye)
    pastMatches.sort((a, b) => {
      const dateA = new Date(`${a.reservationDate}T${a.startTime}`);
      const dateB = new Date(`${b.reservationDate}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    res.json({
      success: true,
      data: {
        upcoming: upcomingMatches,
        past: pastMatches,
        total: matchesResult.rows.length,
      },
    });
  } catch (error: any) {
    console.error('Get team matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Maçlar alınırken hata oluştu',
      error: error.message,
    });
  }
};
