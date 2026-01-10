# Halısaha Yönetim ve Sosyal Ağı

Modern halısaha rezervasyon ve sosyal ağ platformu.

## Proje Yapısı

```
Halisaha/
├── backend/                 # Node.js + Express Backend
│   ├── src/
│   │   ├── config/         # Veritabanı ve uygulama konfigürasyonları
│   │   ├── controllers/    # Route controller'ları
│   │   ├── middleware/     # Express middleware'leri (auth, validation, vb.)
│   │   ├── models/         # PostgreSQL model tanımları
│   │   ├── routes/         # API route'ları
│   │   ├── services/       # İş mantığı servisleri
│   │   └── utils/          # Yardımcı fonksiyonlar
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Next.js 14+ Frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router (pages)
│   │   ├── components/    # React bileşenleri
│   │   ├── lib/          # Kütüphane yapılandırmaları
│   │   ├── types/        # TypeScript type tanımları
│   │   ├── hooks/        # Custom React hooks
│   │   └── services/     # API çağrıları
│   ├── public/           # Statik dosyalar
│   ├── package.json
│   └── tsconfig.json
│
├── database/              # Veritabanı dosyaları
│   ├── migrations/       # Veritabanı migration'ları
│   └── seeds/           # Seed data
│
└── docs/                 # Proje dokümantasyonu
```

## Teknoloji Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context / Zustand

### Database
- **PostgreSQL** with:
  - JSONB for flexible user profiles
  - PostGIS for location services
  - Exclusion Constraints for double booking prevention

## Ana Özellikler

1. **Rezervasyon Sistemi**
   - Gerçek zamanlı saha müsaitlik kontrolü
   - Dinamik fiyatlandırma
   - Otomatik çifte rezervasyon engelleme

2. **Sosyal Ağ**
   - Kullanıcı profilleri
   - Takım yönetimi
   - Maç geçmişi ve istatistikler

3. **Matchmaking (Eşleştirme)**
   - Oyuncu bul
   - Rakip bul
   - ELO tabanlı seviye sistemi

4. **Gamification**
   - Güvenilir oyuncu puanı
   - Rozet ve başarı sistemi
   - Streak (seri) mekanizması

## Kurulum

### Gereksinimler
- Node.js (v18 veya üstü)
- PostgreSQL (v14 veya üstü)
- npm veya yarn

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd Halisaha
```

### 2. Backend Kurulumu

```bash
# Backend klasörüne gidin
cd backend

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun
cp .env.example .env
```

**.env dosyasını düzenleyin:**
```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=halisaha
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Veritabanı Kurulumu

```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Veritabanını oluşturun
CREATE DATABASE halisaha;

# Veritabanından çıkın
\q

# Migration'ları çalıştırın
cd ../database/migrations
psql -U postgres -d halisaha -f 001_create_users.sql
psql -U postgres -d halisaha -f 002_create_venues.sql
psql -U postgres -d halisaha -f 003_create_reservations.sql
psql -U postgres -d halisaha -f 004_create_teams_matches.sql
psql -U postgres -d halisaha -f 005_create_social_features.sql
psql -U postgres -d halisaha -f 006_create_opponent_search.sql
```

### 4. Frontend Kurulumu

```bash
# Frontend klasörüne gidin
cd ../../frontend

# Bağımlılıkları yükleyin
npm install

# .env.local dosyasını oluşturun
cp .env.example .env.local
```

**.env.local dosyasını düzenleyin:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Projeyi Çalıştırın

**Backend'i başlatın (bir terminalde):**
```bash
cd backend
npm run dev
```

**Frontend'i başlatın (başka bir terminalde):**
```bash
cd frontend
npm run dev
```

### 6. Tarayıcıda Açın

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### İlk Admin Kullanıcısı

Veritabanına ilk admin kullanıcısını eklemek için:

```bash
cd database/seeds
psql -U postgres -d halisaha -f admin_user.sql
```

**Varsayılan admin giriş bilgileri:**
- Email: admin@halisaha.com
- Şifre: Admin123!

> ⚠️ **Önemli**: Üretim ortamında mutlaka şifreyi değiştirin!

## Geliştirme Komutları

### Backend
```bash
npm run dev          # Development modda çalıştır
npm run build        # TypeScript compile et
npm start           # Production modda çalıştır
```

### Frontend
```bash
npm run dev         # Development modda çalıştır
npm run build       # Production build
npm start          # Production modda çalıştır
npm run lint       # Linting kontrolü
```

## Sorun Giderme

### Port zaten kullanılıyor
Eğer port kullanımda hatası alıyorsanız:
```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### PostgreSQL bağlantı hatası
- PostgreSQL'in çalıştığından emin olun: `sudo systemctl status postgresql`
- Kullanıcı adı ve şifrenin doğru olduğundan emin olun
- Veritabanının oluşturulduğundan emin olun: `psql -U postgres -l`

### Migration hataları
Eğer migration'lar çalışmazsa:
```bash
# Veritabanını sıfırlayın
psql -U postgres
DROP DATABASE halisaha;
CREATE DATABASE halisaha;
\q

# Migration'ları tekrar çalıştırın
cd database/migrations
psql -U postgres -d halisaha -f 001_create_users.sql
psql -U postgres -d halisaha -f 002_create_venues.sql
psql -U postgres -d halisaha -f 003_create_reservations.sql
psql -U postgres -d halisaha -f 004_create_teams_matches.sql
psql -U postgres -d halisaha -f 005_create_social_features.sql
psql -U postgres -d halisaha -f 006_create_opponent_search.sql
```

## Lisans

Tüm hakları saklıdır.
