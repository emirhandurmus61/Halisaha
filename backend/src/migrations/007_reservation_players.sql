-- Rezervasyona katılan oyuncuları takip etmek için tablo
CREATE TABLE IF NOT EXISTS reservation_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_via VARCHAR(20) DEFAULT 'manual', -- 'manual' or 'team'
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reservation_id, user_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_reservation_players_reservation_id ON reservation_players(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_players_user_id ON reservation_players(user_id);
CREATE INDEX IF NOT EXISTS idx_reservation_players_team_id ON reservation_players(team_id);

-- Rezervasyonlara team_id ekle
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_team_id ON reservations(team_id);
