-- Player Ratings System
-- Oyuncuların maç sonrası değerlendirilmesi için tablo

CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Puan kategorileri (0-100 arası)
  speed_rating INTEGER CHECK (speed_rating >= 0 AND speed_rating <= 100),
  technique_rating INTEGER CHECK (technique_rating >= 0 AND technique_rating <= 100),
  passing_rating INTEGER CHECK (passing_rating >= 0 AND passing_rating <= 100),
  physical_rating INTEGER CHECK (physical_rating >= 0 AND physical_rating <= 100),

  -- Ortalama puan (otomatik hesaplanacak)
  overall_rating DECIMAL(5,2) CHECK (overall_rating >= 0 AND overall_rating <= 100),

  -- Yorum (opsiyonel)
  comment TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Bir kullanıcı bir rezervasyonda bir oyuncuyu sadece bir kez değerlendirebilir
  UNIQUE(reservation_id, rated_user_id, rater_user_id)
);

-- İndeksler
CREATE INDEX idx_player_ratings_rated_user ON player_ratings(rated_user_id);
CREATE INDEX idx_player_ratings_rater_user ON player_ratings(rater_user_id);
CREATE INDEX idx_player_ratings_reservation ON player_ratings(reservation_id);
CREATE INDEX idx_player_ratings_created_at ON player_ratings(created_at DESC);

-- Ortalama puanı otomatik hesaplayan trigger
CREATE OR REPLACE FUNCTION calculate_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_rating := (
    COALESCE(NEW.speed_rating, 0) +
    COALESCE(NEW.technique_rating, 0) +
    COALESCE(NEW.passing_rating, 0) +
    COALESCE(NEW.physical_rating, 0)
  ) / 4.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_overall_rating
BEFORE INSERT OR UPDATE ON player_ratings
FOR EACH ROW
EXECUTE FUNCTION calculate_overall_rating();

-- Kullanıcı istatistiklerini güncelleyen view
CREATE OR REPLACE VIEW user_rating_stats AS
SELECT
  u.id as user_id,
  u.first_name,
  u.last_name,
  u.email,
  COUNT(pr.id) as total_ratings_received,
  ROUND(AVG(pr.speed_rating)::numeric, 0) as avg_speed,
  ROUND(AVG(pr.technique_rating)::numeric, 0) as avg_technique,
  ROUND(AVG(pr.passing_rating)::numeric, 0) as avg_passing,
  ROUND(AVG(pr.physical_rating)::numeric, 0) as avg_physical,
  ROUND(AVG(pr.overall_rating)::numeric, 0) as avg_overall
FROM users u
LEFT JOIN player_ratings pr ON u.id = pr.rated_user_id
GROUP BY u.id, u.first_name, u.last_name, u.email;
