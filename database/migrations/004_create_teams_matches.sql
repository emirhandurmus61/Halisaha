-- ====================================
-- TEAMS TABLE (Takımlar)
-- ====================================
-- Kullanıcıların oluşturduğu takımlar

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Takım kaptanı

    -- Takım Bilgileri
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    -- URL friendly: "kadikoy-yildizlari"

    logo_url VARCHAR(500),
    description TEXT,

    -- Takım İstatistikleri
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_draws INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,

    elo_rating INTEGER DEFAULT 1000,
    -- Takım ELO puanı

    -- Finansal (Opsiyonel)
    team_balance DECIMAL(10, 2) DEFAULT 0.00,
    -- Takım kasası - ortak harcamalar için

    -- Ayarlar
    is_public BOOLEAN DEFAULT TRUE,
    -- Herkese açık mı, yoksa özel mi

    allow_join_requests BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- TEAM MEMBERS (Takım Üyeleri)
-- ====================================
-- Takım - Oyuncu ilişkisi

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(50) DEFAULT 'member',
    -- 'captain', 'co_captain', 'member'

    position VARCHAR(50),
    -- 'goalkeeper', 'defender', 'midfielder', 'forward'

    jersey_number INTEGER,

    -- İstatistikler (Bu takımda)
    matches_played INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,

    -- Durum
    status VARCHAR(50) DEFAULT 'active',
    -- 'active', 'inactive', 'pending'

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(team_id, user_id)
    -- Bir kullanıcı aynı takımda iki kez olamaz
);

-- ====================================
-- MATCHES TABLE (Maçlar)
-- ====================================
-- Takımlar arası veya açık maçlar

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    -- Hangi rezervasyonla ilişkili

    -- Maç Tipi
    match_type VARCHAR(50) NOT NULL,
    -- 'team_vs_team': İki takım karşılaşması
    -- 'open_match': Açık maç (oyuncu arıyor)
    -- 'casual': Arkadaşlar arası

    -- Takımlar
    home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

    -- Açık Maç Bilgileri (match_type='open_match' ise)
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Maçı organize eden kişi

    required_players INTEGER,
    -- Kaç oyuncu aranıyor

    current_players INTEGER DEFAULT 0,

    -- Skor
    home_score INTEGER,
    away_score INTEGER,

    -- Maç Durumu
    status VARCHAR(50) DEFAULT 'scheduled',
    -- 'scheduled', 'in_progress', 'completed', 'cancelled'

    -- Maç Zamanı
    match_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,

    -- Konum
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,

    -- Video ve Medya
    video_url VARCHAR(500),
    highlight_urls JSONB DEFAULT '[]'::jsonb,
    -- AI ile oluşturulan önemli anlar

    -- Maç Detayları
    match_data JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "goals": [...],
    --   "cards": [...],
    --   "mvp": "user_id",
    --   "weather": "sunny"
    -- }

    -- Notlar
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- MATCH PARTICIPANTS (Maç Katılımcıları)
-- ====================================
-- Maça katılan bireysel oyuncular

CREATE TABLE IF NOT EXISTS match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    team_side VARCHAR(10),
    -- 'home', 'away', NULL (open match için)

    position VARCHAR(50),

    -- İstatistikler
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,

    -- Katılım Durumu
    attendance_status VARCHAR(50) DEFAULT 'confirmed',
    -- 'confirmed', 'pending', 'declined', 'no_show'

    -- MVP
    is_mvp BOOLEAN DEFAULT FALSE,

    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(match_id, user_id)
);

-- İndeksler
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_elo_rating ON teams(elo_rating);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

CREATE INDEX idx_matches_match_type ON matches(match_type);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_organizer ON matches(organizer_id);

CREATE INDEX idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX idx_match_participants_user_id ON match_participants(user_id);

-- Triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
