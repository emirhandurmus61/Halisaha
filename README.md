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

Detaylı kurulum adımları docs/ klasöründe bulunmaktadır.

## Lisans

Tüm hakları saklıdır.
