-- Trust Score System (Güven Puanı Sistemi)
-- Oyuncuların güvenilirliğini ölçen sistem

-- Users tablosuna güven puanı kolonu ekle
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100);

-- Güven puanı geçmişi için tablo
CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,

  -- Değişiklik türü
  action_type VARCHAR(50) NOT NULL, -- 'no_show', 'fight', 'late', 'good_behavior', 'completed_match'

  -- Puan değişimi (pozitif veya negatif)
  score_change INTEGER NOT NULL,

  -- Değişiklik öncesi ve sonrası puanlar
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,

  -- Açıklama
  description TEXT,

  -- Kim tarafından yapıldı (opsiyonel - sistem otomatik de yapabilir)
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_trust_score_history_user ON trust_score_history(user_id);
CREATE INDEX idx_trust_score_history_reservation ON trust_score_history(reservation_id);
CREATE INDEX idx_trust_score_history_created_at ON trust_score_history(created_at DESC);

-- Güven puanı kategorileri view
CREATE OR REPLACE VIEW user_trust_levels AS
SELECT
  id as user_id,
  first_name,
  last_name,
  email,
  trust_score,
  CASE
    WHEN trust_score >= 90 THEN 'Mükemmel'
    WHEN trust_score >= 75 THEN 'Güvenilir'
    WHEN trust_score >= 60 THEN 'Orta'
    WHEN trust_score >= 40 THEN 'Düşük'
    ELSE 'Çok Düşük'
  END as trust_level,
  CASE
    WHEN trust_score >= 90 THEN 'green'
    WHEN trust_score >= 75 THEN 'blue'
    WHEN trust_score >= 60 THEN 'yellow'
    WHEN trust_score >= 40 THEN 'orange'
    ELSE 'red'
  END as trust_color
FROM users;

-- Player ratings tablosuna güven puanı ile ilgili alanlar ekle
ALTER TABLE player_ratings
ADD COLUMN IF NOT EXISTS showed_up BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS caused_trouble BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS was_late BOOLEAN DEFAULT FALSE;

-- Güven puanını güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_trust_score(
  p_user_id UUID,
  p_action_type VARCHAR(50),
  p_score_change INTEGER,
  p_reservation_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Mevcut puanı al
  SELECT trust_score INTO v_old_score
  FROM users
  WHERE id = p_user_id;

  -- Yeni puanı hesapla (0-100 arası sınırla)
  v_new_score := GREATEST(0, LEAST(100, v_old_score + p_score_change));

  -- Users tablosunu güncelle
  UPDATE users
  SET trust_score = v_new_score,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  -- Geçmişe kaydet
  INSERT INTO trust_score_history (
    user_id,
    reservation_id,
    action_type,
    score_change,
    old_score,
    new_score,
    description,
    created_by
  ) VALUES (
    p_user_id,
    p_reservation_id,
    p_action_type,
    p_score_change,
    v_old_score,
    v_new_score,
    p_description,
    p_created_by
  );
END;
$$ LANGUAGE plpgsql;

-- Otomatik güven puanı güncellemesi için trigger
-- Oyuncu değerlendirmesi yapıldığında
CREATE OR REPLACE FUNCTION auto_update_trust_score_on_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Maça gelmediyse
  IF NEW.showed_up = FALSE THEN
    PERFORM update_trust_score(
      NEW.rated_user_id,
      'no_show',
      -15, -- 15 puan düşür
      NEW.reservation_id,
      'Maça katılmadı',
      NEW.rater_user_id
    );
  END IF;

  -- Kavga çıkardıysa
  IF NEW.caused_trouble = TRUE THEN
    PERFORM update_trust_score(
      NEW.rated_user_id,
      'fight',
      -20, -- 20 puan düşür
      NEW.reservation_id,
      'Maçta sorun çıkardı',
      NEW.rater_user_id
    );
  END IF;

  -- Geç kaldıysa
  IF NEW.was_late = TRUE THEN
    PERFORM update_trust_score(
      NEW.rated_user_id,
      'late',
      -5, -- 5 puan düşür
      NEW.reservation_id,
      'Maça geç kaldı',
      NEW.rater_user_id
    );
  END IF;

  -- İyi davranış (maça geldi, sorun çıkarmadı, geç kalmadı)
  IF NEW.showed_up = TRUE AND NEW.caused_trouble = FALSE AND NEW.was_late = FALSE THEN
    PERFORM update_trust_score(
      NEW.rated_user_id,
      'good_behavior',
      2, -- 2 puan artır
      NEW.reservation_id,
      'Maça düzgün katıldı',
      NEW.rater_user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_trust_score_on_rating
AFTER INSERT ON player_ratings
FOR EACH ROW
EXECUTE FUNCTION auto_update_trust_score_on_rating();

-- Kullanıcı istatistikleri view'ına güven puanı ekle
DROP VIEW IF EXISTS user_rating_stats;
CREATE OR REPLACE VIEW user_rating_stats AS
SELECT
  u.id as user_id,
  u.first_name,
  u.last_name,
  u.email,
  u.trust_score,
  COUNT(pr.id) as total_ratings_received,
  ROUND(AVG(pr.speed_rating)::numeric, 0) as avg_speed,
  ROUND(AVG(pr.technique_rating)::numeric, 0) as avg_technique,
  ROUND(AVG(pr.passing_rating)::numeric, 0) as avg_passing,
  ROUND(AVG(pr.physical_rating)::numeric, 0) as avg_physical,
  ROUND(AVG(pr.overall_rating)::numeric, 0) as avg_overall,
  -- Güven puanı istatistikleri
  COUNT(CASE WHEN pr.showed_up = FALSE THEN 1 END) as no_show_count,
  COUNT(CASE WHEN pr.caused_trouble = TRUE THEN 1 END) as trouble_count,
  COUNT(CASE WHEN pr.was_late = TRUE THEN 1 END) as late_count,
  COUNT(CASE WHEN pr.showed_up = TRUE AND pr.caused_trouble = FALSE THEN 1 END) as good_behavior_count
FROM users u
LEFT JOIN player_ratings pr ON u.id = pr.rated_user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.trust_score;
