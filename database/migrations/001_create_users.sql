-- ====================================
-- USERS TABLE (Kullanıcılar)
-- ====================================
-- Tüm kullanıcıların (oyuncular, tesis sahipleri, adminler) temel bilgileri

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Temel Bilgiler
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    -- Kullanıcı Tipi
    user_type VARCHAR(20) NOT NULL DEFAULT 'player',
    -- 'player': Normal oyuncu
    -- 'venue_owner': Tesis sahibi
    -- 'admin': Sistem yöneticisi

    -- Profil Bilgileri (JSONB - Esnek yapı)
    profile_data JSONB DEFAULT '{}'::jsonb,
    -- Örnek içerik:
    -- {
    --   "avatar_url": "https://...",
    --   "bio": "Savunma oyuncusuyum",
    --   "preferred_position": "Defans",
    --   "skill_level": 7,
    --   "favorite_teams": ["Galatasaray"],
    --   "birth_date": "1990-05-15"
    -- }

    -- Oyuncu Puanları ve İstatistikler
    trust_score INTEGER DEFAULT 100,
    -- Güvenilir oyuncu puanı (Uber benzeri)
    -- Maça gelmeme her defasında düşer

    elo_rating INTEGER DEFAULT 1000,
    -- Rakip bul için ELO puanı

    total_matches_played INTEGER DEFAULT 0,
    total_no_shows INTEGER DEFAULT 0,
    -- Maça gelmeme sayısı

    -- Gamification (Oyunlaştırma)
    current_streak INTEGER DEFAULT 0,
    -- Duolingo benzeri - Kaç hafta üst üste maç yaptı

    longest_streak INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    -- Rozetler: ["fair_play", "goal_scorer", "100_matches"]

    -- Hesap Durumu
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- İndeksler (Performans için)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_elo_rating ON users(elo_rating);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- JSONB indeksleri
CREATE INDEX idx_users_profile_data ON users USING GIN (profile_data);
CREATE INDEX idx_users_badges ON users USING GIN (badges);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Varsayılan admin kullanıcı (şifre: admin123)
-- Bcrypt hash: $2a$10$... (gerçek hash backend'de oluşturulacak)
INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_verified)
VALUES ('admin@halisaha.com', '$2a$10$placeholder', 'Admin', 'User', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;
