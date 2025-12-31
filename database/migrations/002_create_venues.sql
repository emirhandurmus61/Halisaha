-- ====================================
-- VENUES TABLE (Halı Saha Tesisleri)
-- ====================================
-- Halısaha tesislerinin bilgileri

CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tesis Bilgileri
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    -- URL friendly: "kadikoy-spor-sahalari"

    description TEXT,

    -- Adres Bilgileri
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    -- İlçe (Kadıköy, Beşiktaş, vb.)

    postal_code VARCHAR(20),

    -- Konum (Gelecekte PostGIS ile genişletilebilir)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- İletişim
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Tesis Özellikleri (JSONB - Esnek)
    amenities JSONB DEFAULT '[]'::jsonb,
    -- Örnek: ["parking", "shower", "cafe", "locker_room"]

    opening_hours JSONB DEFAULT '{}'::jsonb,
    -- Örnek:
    -- {
    --   "monday": {"open": "08:00", "close": "23:00"},
    --   "tuesday": {"open": "08:00", "close": "23:00"},
    --   ...
    -- }

    -- Fiyatlandırma
    base_price_per_hour DECIMAL(10, 2),
    -- Temel saat ücreti (TL)

    pricing_rules JSONB DEFAULT '[]'::jsonb,
    -- Dinamik fiyatlandırma kuralları
    -- Örnek:
    -- [
    --   {"time_range": "20:00-23:00", "multiplier": 1.5, "label": "Prime Time"},
    --   {"day": "weekend", "multiplier": 1.3}
    -- ]

    -- Görsel
    images JSONB DEFAULT '[]'::jsonb,
    -- Saha fotoğrafları
    -- ["https://...", "https://..."]

    cover_image VARCHAR(500),
    -- Kapak fotoğrafı

    -- İstatistikler
    total_bookings INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,

    -- Durum
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    -- Admin onayı

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fields (Sahalar) - Bir tesiste birden fazla saha olabilir
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

    -- Saha Bilgileri
    name VARCHAR(100) NOT NULL,
    -- "Saha 1", "Büyük Saha", vb.

    field_type VARCHAR(50) NOT NULL,
    -- "5v5", "7v7", "11v11"

    surface_type VARCHAR(50),
    -- "artificial_grass", "natural_grass", "concrete"

    -- Boyutlar
    length_meters INTEGER,
    width_meters INTEGER,

    -- Özellikler
    has_lighting BOOLEAN DEFAULT TRUE,
    has_roof BOOLEAN DEFAULT FALSE,

    features JSONB DEFAULT '[]'::jsonb,
    -- ["lighting", "scoreboard", "seating"]

    -- Durum
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_venues_owner_id ON venues(owner_id);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_district ON venues(district);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_is_active ON venues(is_active);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);

CREATE INDEX idx_fields_venue_id ON fields(venue_id);
CREATE INDEX idx_fields_field_type ON fields(field_type);

-- JSONB indeksleri
CREATE INDEX idx_venues_amenities ON venues USING GIN (amenities);
CREATE INDEX idx_venues_pricing_rules ON venues USING GIN (pricing_rules);

-- Trigger: updated_at otomatik güncelleme
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
