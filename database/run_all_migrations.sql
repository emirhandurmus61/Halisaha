-- ====================================
-- HALIŞAHA YÖNETİM VE SOSYAL AĞI
-- Tüm Migration'ları Çalıştır
-- ====================================

-- Bu dosyayı PgAdmin'de halisaha_db veritabanında çalıştırın
-- Veya terminal'den:
-- PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db -f run_all_migrations.sql

\echo '================================'
\echo 'Migration başlatılıyor...'
\echo '================================'

-- 1. Users tablosu
\echo '📝 1/5: Users tablosu oluşturuluyor...'
\i 001_create_users.sql
\echo '✅ Users tablosu tamamlandı!'

-- 2. Venues ve Fields tabloları
\echo '📝 2/5: Venues ve Fields tabloları oluşturuluyor...'
\i 002_create_venues.sql
\echo '✅ Venues ve Fields tabloları tamamlandı!'

-- 3. Reservations tablosu
\echo '📝 3/5: Reservations tablosu oluşturuluyor...'
\i 003_create_reservations.sql
\echo '✅ Reservations tablosu tamamlandı!'

-- 4. Teams ve Matches tabloları
\echo '📝 4/5: Teams ve Matches tabloları oluşturuluyor...'
\i 004_create_teams_matches.sql
\echo '✅ Teams ve Matches tabloları tamamlandı!'

-- 5. Social Features
\echo '📝 5/5: Social Features tabloları oluşturuluyor...'
\i 005_create_social_features.sql
\echo '✅ Social Features tabloları tamamlandı!'

\echo ''
\echo '================================'
\echo '✅ Tüm migration'lar başarıyla tamamlandı!'
\echo '================================'

-- Tabloları listele
\echo ''
\echo 'Oluşturulan tablolar:'
\dt

-- Toplam tablo sayısı
SELECT COUNT(*) AS "Toplam Tablo Sayısı" FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
