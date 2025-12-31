-- Halısaha Yönetim ve Sosyal Ağı - Veritabanı Oluşturma
-- Bu dosyayı PgAdmin'de çalıştırarak veritabanını oluşturabilirsiniz
-- NOT: PostgreSQL Port: 5433 (Varsayılan 5432 değil!)

-- 1. Veritabanını oluştur
CREATE DATABASE halisaha_db
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'tr_TR.UTF-8'
    LC_CTYPE = 'tr_TR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 2. Veritabanına bağlan (PgAdmin'de halisaha_db'yi seçin)
\c halisaha_db;

-- 3. PostgreSQL uzantılarını aktifleştir
-- UUID için
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- JSONB işlemleri için (varsayılan olarak yüklü)
-- CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Gelecekte konum servisleri için (şimdilik yorum satırında)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

COMMENT ON DATABASE halisaha_db IS 'Halısaha Yönetim ve Sosyal Ağı platformu için ana veritabanı';
