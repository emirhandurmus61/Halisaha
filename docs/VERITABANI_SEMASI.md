# Halısaha Veritabanı Şeması Dokümantasyonu

## Genel Bakış

Toplam **16 tablo** ile kapsamlı bir halısaha yönetim ve sosyal ağ platformu.

## Tablo Listesi

### 1. Kullanıcı Yönetimi
- **users** - Kullanıcılar (oyuncular, tesis sahipleri, adminler)

### 2. Tesis Yönetimi
- **venues** - Halısaha tesisleri
- **fields** - Sahalar (bir tesiste birden fazla saha olabilir)

### 3. Rezervasyon Sistemi
- **reservations** - Rezervasyonlar (çifte rezervasyon engelli!)
- **time_slots** - Zaman dilimleri (opsiyonel)

### 4. Takım ve Maç Yönetimi
- **teams** - Takımlar
- **team_members** - Takım üyeleri
- **matches** - Maçlar
- **match_participants** - Maç katılımcıları

### 5. Sosyal Ağ Özellikleri
- **reviews** - Değerlendirmeler (tesisler ve oyuncular için)
- **friendships** - Arkadaşlıklar
- **notifications** - Bildirimler
- **posts** - Sosyal paylaşımlar
- **post_likes** - Beğeniler
- **post_comments** - Yorumlar
- **player_search_listings** - Oyuncu arama ilanları

---

## Detaylı Tablo Açıklamaları

### USERS (Kullanıcılar)

**Amaç**: Tüm kullanıcıların merkezi tablosu

**Önemli Alanlar**:
- `user_type`: 'player', 'venue_owner', 'admin'
- `profile_data` (JSONB): Esnek profil bilgileri
- `trust_score`: Güvenilir oyuncu puanı (Uber benzeri)
- `elo_rating`: ELO puanlama sistemi
- `current_streak`: Duolingo benzeri seri sistemi
- `badges` (JSONB): Rozetler

**Özellikler**:
✅ Otomatik `updated_at` trigger
✅ JSONB indeksleme
✅ Email unique constraint

---

### VENUES & FIELDS (Tesisler ve Sahalar)

**Venues (Tesisler)**:
- Tesis sahiplerinin tesisleri
- `amenities` (JSONB): Tesis özellikleri
- `opening_hours` (JSONB): Çalışma saatleri
- `pricing_rules` (JSONB): Dinamik fiyatlandırma

**Fields (Sahalar)**:
- Bir tesiste birden fazla saha olabilir
- `field_type`: "5v5", "7v7", "11v11"
- `surface_type`: "artificial_grass", "natural_grass"

---

### RESERVATIONS (Rezervasyonlar)

**Amaç**: Saha rezervasyonları

**ÇİFTE REZERVASYON ENGELLEMESİ** 🔒:
```sql
-- PostgreSQL Exclusion Constraint
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING gist (
    field_id WITH =,
    tsrange(...) WITH &&
)
```

**Özellikler**:
- Aynı sahada aynı saatte iki rezervasyon yapılamaz
- Ödeme durumu takibi (pre_authorization desteği)
- İptal ve iade yönetimi
- Otomatik kullanıcı istatistik güncelleme

**Trigger**:
- Rezervasyon tamamlandığında → `total_matches_played` +1
- No-show olduğunda → `trust_score` -10, `current_streak` sıfırlanır

---

### TEAMS & MATCHES (Takımlar ve Maçlar)

**Teams (Takımlar)**:
- Kullanıcıların oluşturduğu takımlar
- `elo_rating`: Takım ELO puanı
- `team_balance`: Ortak takım kasası

**Team Members**:
- Takım üyeleri
- `position`, `jersey_number`
- Bireysel istatistikler

**Matches (Maçlar)**:
- `match_type`: 'team_vs_team', 'open_match', 'casual'
- `match_data` (JSONB): Gol, kart, MVP bilgileri
- `highlight_urls` (JSONB): AI ile oluşturulan önemli anlar

---

### SOCIAL FEATURES (Sosyal Özellikler)

**Reviews (Değerlendirmeler)**:
- Polymorphic yapı: Tesis, kullanıcı, takım değerlendirilebilir
- `detailed_ratings` (JSONB): Detaylı puanlar

**Friendships**:
- Arkadaşlık istekleri
- `status`: 'pending', 'accepted', 'blocked'

**Notifications**:
- Push notification altyapısı
- `data` (JSONB): Dinamik bildirim verileri

**Posts & Engagement**:
- Sosyal medya benzeri paylaşımlar
- Otomatik like/comment sayacı (trigger ile)

**Player Search**:
- "Oyuncu Bul" özelliği
- `position_needed`, `skill_level_min/max`

---

## Özel Özellikler

### 1. JSONB Kullanımı
- Esnek veri yapıları (MongoDB benzeri)
- GIN indeksleme ile hızlı sorgular

### 2. Otomatik Trigger'lar
- `updated_at` otomatik güncelleme
- İstatistik sayaçları (likes, comments)
- Kullanıcı puanları (no-show, streak)

### 3. Data Integrity
- Foreign key constraints
- Check constraints
- Unique constraints
- Exclusion constraints (çifte rezervasyon)

### 4. Performans Optimizasyonları
- Strategik indeksler
- JSONB GIN indeksleri
- Composite indeksler

---

## Örnek Sorgular

### Çifte Rezervasyon Kontrolü
```sql
-- Bu sorgu HATA verecek (çifte rezervasyon)
INSERT INTO reservations (field_id, user_id, reservation_date, start_time, end_time, ...)
VALUES ('field-uuid', 'user-uuid', '2025-01-15', '20:00', '21:00', ...);

-- Aynı field_id ve zaman aralığında başka bir rezervasyon varsa:
-- ERROR: conflicting key value violates exclusion constraint
```

### En İyi Oyuncular (ELO'ya Göre)
```sql
SELECT first_name, last_name, elo_rating, total_matches_played
FROM users
WHERE user_type = 'player'
ORDER BY elo_rating DESC
LIMIT 10;
```

### Açık Maç İlanları
```sql
SELECT m.*, u.first_name, u.last_name, v.name AS venue_name
FROM matches m
JOIN users u ON m.organizer_id = u.id
JOIN venues v ON m.venue_id = v.id
WHERE m.match_type = 'open_match'
  AND m.status = 'scheduled'
  AND m.current_players < m.required_players
ORDER BY m.match_date, m.start_time;
```

### Kullanıcı Trust Score Sıralaması
```sql
SELECT first_name, last_name, trust_score, total_no_shows
FROM users
WHERE user_type = 'player'
ORDER BY trust_score DESC;
```

---

## Migration Çalıştırma

### Tüm migration'ları çalıştırmak için:

```bash
cd /home/emirhan-ubuntu/Halisaha/database/migrations
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f 001_create_users.sql
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f 002_create_venues.sql
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f 003_create_reservations.sql
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f 004_create_teams_matches.sql
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f 005_create_social_features.sql
```

---

## Sonuç

✅ 16 tablo başarıyla oluşturuldu
✅ Çifte rezervasyon engellendi (Exclusion Constraint)
✅ JSONB ile esnek veri yapısı
✅ Otomatik trigger'lar aktif
✅ İndeksler optimize edildi
✅ Playtomic benzeri sosyal ağ altyapısı hazır
