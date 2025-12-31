-- ====================================
-- OPPONENT SEARCH (Rakip Bul)
-- ====================================
-- Takımların rakip araması için ilan sistemi

CREATE TABLE IF NOT EXISTS opponent_search_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Maç Tercihleri
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Tarih Aralığı
    preferred_date_start DATE NOT NULL,
    preferred_date_end DATE NOT NULL,

    -- Zaman Tercihleri
    preferred_times JSONB DEFAULT '[]'::jsonb,
    -- Örnek: ["morning", "afternoon", "evening", "night"]
    -- veya belirli saatler: ["18:00", "19:00", "20:00"]

    -- Konum Tercihleri
    city VARCHAR(100),
    district VARCHAR(100),
    preferred_venue_ids JSONB DEFAULT '[]'::jsonb,
    -- İstenen saha ID'leri (opsiyonel)

    -- Takım Gereksinimleri
    min_elo_rating INTEGER,
    max_elo_rating INTEGER,

    -- Maç Bilgileri
    match_type VARCHAR(50) DEFAULT 'friendly',
    -- 'friendly', 'competitive', 'tournament'

    field_size VARCHAR(50),
    -- 'halısaha_5', 'halısaha_7', 'halısaha_8', 'halısaha_11'

    match_duration INTEGER DEFAULT 60,
    -- Dakika cinsinden maç süresi

    -- Maliyet
    cost_sharing VARCHAR(50) DEFAULT 'split',
    -- 'split', 'home_pays', 'away_pays', 'free'

    estimated_cost DECIMAL(10, 2),

    -- Ek Bilgiler
    additional_info JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "uniformRequired": true,
    --   "refereeNeeded": false,
    --   "recordingAllowed": true
    -- }

    -- Durum
    status VARCHAR(50) DEFAULT 'active',
    -- 'active', 'matched', 'cancelled', 'expired'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ====================================
-- MATCH PROPOSALS (Maç Teklifleri)
-- ====================================
-- Takımların birbirine gönderdiği maç teklifleri

CREATE TABLE IF NOT EXISTS match_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- İlgili İlan (Opsiyonel - direkt teklif de gönderilebilir)
    opponent_listing_id UUID REFERENCES opponent_search_listings(id) ON DELETE SET NULL,

    -- Teklif Eden Takım
    proposing_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    proposed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Teklif Alan Takım
    target_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Maç Detayları
    proposed_date DATE NOT NULL,
    proposed_time TIME NOT NULL,
    proposed_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    proposed_field_id UUID REFERENCES fields(id) ON DELETE SET NULL,

    match_duration INTEGER DEFAULT 60,
    field_size VARCHAR(50),

    -- Mesaj
    message TEXT,

    -- Maliyet
    cost_sharing VARCHAR(50) DEFAULT 'split',
    estimated_cost DECIMAL(10, 2),

    -- Teklif Durumu
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'accepted', 'rejected', 'cancelled', 'expired'

    -- Yanıt
    response_message TEXT,
    responded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP,

    -- Oluşturulan Maç (Kabul edilirse)
    created_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    -- Aynı takım kendine teklif gönderemez
    CHECK (proposing_team_id != target_team_id)
);

-- ====================================
-- TEAM INVITATIONS (Takım Davetleri)
-- ====================================
-- Takıma oyuncu davet sistemi (zaten var gibi görünüyor ama ekleyelim)

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    message TEXT,

    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'accepted', 'rejected', 'cancelled'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(team_id, invited_user_id, status)
);

-- ====================================
-- İndeksler
-- ====================================

CREATE INDEX idx_opponent_search_team_id ON opponent_search_listings(team_id);
CREATE INDEX idx_opponent_search_status ON opponent_search_listings(status);
CREATE INDEX idx_opponent_search_city ON opponent_search_listings(city);
CREATE INDEX idx_opponent_search_district ON opponent_search_listings(district);
CREATE INDEX idx_opponent_search_dates ON opponent_search_listings(preferred_date_start, preferred_date_end);
CREATE INDEX idx_opponent_search_created_at ON opponent_search_listings(created_at DESC);

CREATE INDEX idx_match_proposals_proposing_team ON match_proposals(proposing_team_id);
CREATE INDEX idx_match_proposals_target_team ON match_proposals(target_team_id);
CREATE INDEX idx_match_proposals_status ON match_proposals(status);
CREATE INDEX idx_match_proposals_listing ON match_proposals(opponent_listing_id);
CREATE INDEX idx_match_proposals_created_at ON match_proposals(created_at DESC);

CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_user ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- ====================================
-- Triggers
-- ====================================

CREATE TRIGGER update_opponent_search_updated_at BEFORE UPDATE ON opponent_search_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_proposals_updated_at BEFORE UPDATE ON match_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- Otomatik Süre Dolma Fonksiyonu
-- ====================================
-- Süresi dolan ilanları otomatik olarak 'expired' yap

CREATE OR REPLACE FUNCTION expire_old_opponent_listings()
RETURNS void AS $$
BEGIN
    UPDATE opponent_search_listings
    SET status = 'expired'
    WHERE status = 'active'
    AND (
        expires_at < CURRENT_TIMESTAMP
        OR preferred_date_end < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Süresi dolan match proposal'ları otomatik olarak 'expired' yap
CREATE OR REPLACE FUNCTION expire_old_match_proposals()
RETURNS void AS $$
BEGIN
    UPDATE match_proposals
    SET status = 'expired'
    WHERE status = 'pending'
    AND (
        expires_at < CURRENT_TIMESTAMP
        OR proposed_date < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Bu fonksiyonları periyodik olarak çalıştırmak için cron job veya
-- pg_cron extension kullanılabilir (opsiyonel)
