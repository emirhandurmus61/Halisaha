-- ====================================
-- RESERVATIONS TABLE (Rezervasyonlar)
-- ====================================
-- Halısaha rezervasyonları - ÇİFTE REZERVASYON ENGELLENMİŞ!

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Rezervasyon Zamanı
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Fiyatlandırma
    base_price DECIMAL(10, 2) NOT NULL,
    -- Temel ücret

    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL,

    -- Ödeme Durumu
    payment_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'pre_authorized', 'paid', 'refunded', 'failed'

    payment_method VARCHAR(50),
    -- 'credit_card', 'iyzico', 'cash'

    payment_id VARCHAR(255),
    -- Ödeme gateway'den dönen ID

    paid_at TIMESTAMP,

    -- Rezervasyon Durumu
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'

    -- İptal Bilgileri
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10, 2),

    -- Maç Bilgileri (Opsiyonel)
    match_id UUID,
    -- İleride matches tablosuna referans

    team_name VARCHAR(100),
    -- Rezervasyon yapan takım adı

    participant_count INTEGER,
    -- Kaç kişi oynayacak

    notes TEXT,
    -- Özel notlar

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ÇİFTE REZERVASYON ENGELLEMESİ
-- ====================================
-- PostgreSQL Exclusion Constraint ile aynı sahada aynı saatte
-- iki rezervasyon yapılamaz!

-- btree_gist extension gerekli
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion Constraint: Aynı field_id ve zaman aralığı çakışamaz
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING gist (
    field_id WITH =,
    tsrange(
        (reservation_date + start_time),
        (reservation_date + end_time)
    ) WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show'));
-- Sadece aktif rezervasyonlar için çakışma kontrolü

-- ====================================
-- TIME SLOTS (Zaman Dilimleri)
-- ====================================
-- Sahaların müsait zaman dilimlerini önceden tanımlamak için (Opsiyonel)

CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,

    day_of_week INTEGER NOT NULL,
    -- 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    default_price DECIMAL(10, 2) NOT NULL,

    is_available BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_reservations_field_id ON reservations(field_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_datetime ON reservations(reservation_date, start_time);

CREATE INDEX idx_time_slots_field_id ON time_slots(field_id);
CREATE INDEX idx_time_slots_day ON time_slots(day_of_week);

-- Trigger: updated_at otomatik güncelleme
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Rezervasyon durumu değiştiğinde kullanıcı istatistiklerini güncelle
CREATE OR REPLACE FUNCTION update_user_stats_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
    -- Maç tamamlandı -> total_matches_played artır
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE users
        SET total_matches_played = total_matches_played + 1,
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1)
        WHERE id = NEW.user_id;
    END IF;

    -- No-show (maça gelmedi) -> trust_score düşür
    IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
        UPDATE users
        SET total_no_shows = total_no_shows + 1,
            trust_score = GREATEST(0, trust_score - 10),
            current_streak = 0
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER UPDATE ON reservations
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_user_stats_on_reservation();
