-- ====================================
-- SOCIAL FEATURES (Sosyal Ağ Özellikleri)
-- ====================================

-- ====================================
-- REVIEWS (Değerlendirmeler)
-- ====================================
-- Tesisler ve oyuncular için değerlendirmeler

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Değerlendirmeyi yapan

    -- Değerlendirilen Hedef (Polymorphic)
    target_type VARCHAR(50) NOT NULL,
    -- 'venue', 'user', 'team'

    target_id UUID NOT NULL,
    -- venues.id, users.id, veya teams.id

    -- Değerlendirme
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Detaylı Puanlar (JSONB)
    detailed_ratings JSONB,
    -- Örnek:
    -- {
    --   "cleanliness": 5,
    --   "facilities": 4,
    --   "staff": 5
    -- }

    -- Durum
    is_verified BOOLEAN DEFAULT FALSE,
    -- Admin tarafından onaylandı mı

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(reviewer_id, target_type, target_id)
    -- Bir kullanıcı aynı hedefe sadece bir değerlendirme yapabilir
);

-- ====================================
-- FRIENDSHIPS (Arkadaşlıklar)
-- ====================================
-- Kullanıcılar arası arkadaşlık ilişkileri

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'accepted', 'blocked'

    -- Kim istek gönderdi
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);

-- ====================================
-- NOTIFICATIONS (Bildirimler)
-- ====================================
-- Kullanıcı bildirimleri

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Bildirim Tipi
    type VARCHAR(100) NOT NULL,
    -- 'match_invitation', 'reservation_confirmed', 'friend_request',
    -- 'team_invitation', 'match_reminder', 'payment_success'

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- İlgili Veri
    data JSONB DEFAULT '{}'::jsonb,
    -- {
    --   "match_id": "...",
    --   "sender_id": "...",
    --   "action_url": "/matches/123"
    -- }

    -- Durum
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- POSTS (Sosyal Paylaşımlar)
-- ====================================
-- Kullanıcıların paylaşımları (Opsiyonel - sosyal ağ için)

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- İçerik
    content TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    video_url VARCHAR(500),

    -- İlişkili Varlıklar
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    -- Maç paylaşımı

    -- İstatistikler
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,

    -- Görünürlük
    visibility VARCHAR(50) DEFAULT 'public',
    -- 'public', 'friends', 'private'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- POST LIKES (Beğeniler)
-- ====================================

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(post_id, user_id)
);

-- ====================================
-- POST COMMENTS (Yorumlar)
-- ====================================

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    comment TEXT NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- PLAYER SEARCH (Oyuncu Arama İlanları)
-- ====================================
-- "Oyuncu Bul" özelliği için

CREATE TABLE IF NOT EXISTS player_search_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Aranılan Oyuncu
    position_needed VARCHAR(50),
    -- 'goalkeeper', 'defender', 'midfielder', 'forward', 'any'

    skill_level_min INTEGER,
    skill_level_max INTEGER,

    players_needed INTEGER NOT NULL DEFAULT 1,

    -- Açıklama
    description TEXT,

    -- Maç Bilgileri
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,

    -- Durum
    status VARCHAR(50) DEFAULT 'open',
    -- 'open', 'filled', 'cancelled'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_match_id ON posts(match_id);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX idx_player_search_status ON player_search_listings(status);
CREATE INDEX idx_player_search_date ON player_search_listings(match_date);
CREATE INDEX idx_player_search_organizer ON player_search_listings(organizer_id);

-- Triggers
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_search_updated_at BEFORE UPDATE ON player_search_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Like eklendiğinde/kaldırıldığında post'un like sayısını güncelle
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger: Yorum eklendiğinde/kaldırıldığında post'un yorum sayısını güncelle
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
