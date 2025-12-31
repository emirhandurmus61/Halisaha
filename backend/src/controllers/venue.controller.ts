import { Request, Response } from 'express';
import { pool } from '../config/database';

// Tüm tesisleri listele
export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const { city, district } = req.query;

    let query = `
      SELECT v.id, v.name, v.slug, v.description, v.address, v.city,
             v.district, v.phone, v.cover_image, v.base_price_per_hour,
             v.average_rating, v.total_reviews, v.is_active,
             u.first_name || ' ' || u.last_name as owner_name
      FROM venues v
      LEFT JOIN users u ON v.owner_id = u.id
      WHERE v.is_active = true
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

    query += ' ORDER BY v.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Get all venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Tesisler alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Tesis detayını getir
export const getVenueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const venueResult = await pool.query(
      `SELECT v.*, u.first_name || ' ' || u.last_name as owner_name
       FROM venues v
       LEFT JOIN users u ON v.owner_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (venueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı',
      });
    }

    // Tesise ait sahaları getir
    const fieldsResult = await pool.query(
      `SELECT id, name, field_type, surface_type, has_lighting, has_roof, is_active
       FROM fields
       WHERE venue_id = $1 AND is_active = true`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...venueResult.rows[0],
        fields: fieldsResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Get venue by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Tesis bilgisi alınırken hata oluştu',
      error: error.message,
    });
  }
};

// Yeni tesis oluştur (sadece venue_owner veya admin)
export const createVenue = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      name,
      slug,
      description,
      address,
      city,
      district,
      phone,
      basePricePerHour,
    } = req.body;

    // Validation
    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Tesis adı, adres ve şehir gereklidir',
      });
    }

    const result = await pool.query(
      `INSERT INTO venues (owner_id, name, slug, description, address, city, district, phone, base_price_per_hour)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        name,
        slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        address,
        city,
        district,
        phone,
        basePricePerHour || 0,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Tesis başarıyla oluşturuldu',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Tesis oluşturulurken hata oluştu',
      error: error.message,
    });
  }
};
