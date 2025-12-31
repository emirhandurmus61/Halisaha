# Proje Yapısı ve Dizin Organizasyonu

## Genel Bakış

```
Halisaha/
├── backend/                           # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/                   # Konfigürasyon dosyaları
│   │   │   ├── database.ts          # PostgreSQL bağlantı ayarları
│   │   │   └── environment.ts       # Ortam değişkenleri
│   │   ├── controllers/              # Route controller'ları
│   │   │   ├── auth.controller.ts   # Kimlik doğrulama
│   │   │   ├── user.controller.ts   # Kullanıcı işlemleri
│   │   │   ├── venue.controller.ts  # Saha işlemleri
│   │   │   ├── reservation.controller.ts
│   │   │   └── match.controller.ts
│   │   ├── middleware/               # Express middleware'ler
│   │   │   ├── auth.middleware.ts   # JWT doğrulama
│   │   │   ├── error.middleware.ts  # Hata yönetimi
│   │   │   └── validation.middleware.ts
│   │   ├── models/                   # Veritabanı modelleri
│   │   │   ├── User.ts
│   │   │   ├── Venue.ts
│   │   │   ├── Reservation.ts
│   │   │   ├── Team.ts
│   │   │   └── Match.ts
│   │   ├── routes/                   # API route tanımları
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── venue.routes.ts
│   │   │   ├── reservation.routes.ts
│   │   │   └── match.routes.ts
│   │   ├── services/                 # İş mantığı servisleri
│   │   │   ├── auth.service.ts
│   │   │   ├── reservation.service.ts
│   │   │   ├── matchmaking.service.ts
│   │   │   └── payment.service.ts
│   │   ├── utils/                    # Yardımcı fonksiyonlar
│   │   │   ├── jwt.utils.ts
│   │   │   ├── hash.utils.ts
│   │   │   └── validation.utils.ts
│   │   └── index.ts                  # Ana giriş noktası
│   ├── .env.example                  # Örnek ortam değişkenleri
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                          # Frontend (Next.js 14+ App Router)
│   ├── public/                       # Statik dosyalar
│   │   ├── images/
│   │   └── icons/
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (auth)/              # Auth grup route'ları
│   │   │   │   ├── giris/           # Giriş yap sayfası
│   │   │   │   └── kayit/           # Üye ol sayfası
│   │   │   ├── (main)/              # Ana uygulama route'ları
│   │   │   │   ├── anasayfa/        # Ana sayfa
│   │   │   │   ├── rezervasyon/     # Rezervasyon sayfası
│   │   │   │   ├── oyuncu-bul/      # Oyuncu bul sayfası
│   │   │   │   └── profil/          # Profil sayfası
│   │   │   ├── layout.tsx           # Root layout
│   │   │   └── page.tsx             # Ana sayfa
│   │   ├── components/               # React bileşenleri
│   │   │   ├── ui/                  # Temel UI bileşenleri
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── layout/              # Layout bileşenleri
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── auth/                # Auth bileşenleri
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── venue/               # Saha bileşenleri
│   │   │   │   ├── VenueCard.tsx
│   │   │   │   └── VenueList.tsx
│   │   │   └── reservation/         # Rezervasyon bileşenleri
│   │   │       ├── Calendar.tsx
│   │   │       └── TimeSlot.tsx
│   │   ├── lib/                     # Kütüphane yapılandırmaları
│   │   │   ├── axios.ts            # Axios instance
│   │   │   └── utils.ts            # Yardımcı fonksiyonlar
│   │   ├── types/                   # TypeScript tip tanımları
│   │   │   ├── user.types.ts
│   │   │   ├── venue.types.ts
│   │   │   └── reservation.types.ts
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useVenue.ts
│   │   │   └── useReservation.ts
│   │   └── services/                # API servis katmanı
│   │       ├── auth.service.ts
│   │       ├── venue.service.ts
│   │       └── reservation.service.ts
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── database/                         # Veritabanı dosyaları
│   ├── migrations/                  # SQL migration dosyaları
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_venues.sql
│   │   ├── 003_create_reservations.sql
│   │   └── 004_create_teams_matches.sql
│   └── seeds/                       # Başlangıç verileri
│       └── sample_data.sql
│
├── docs/                            # Proje dokümantasyonu
│   ├── PROJE_YAPISI.md             # Bu dosya
│   ├── API_ENDPOINTS.md            # API dokümantasyonu
│   └── VERITABANI_SEMASI.md        # Veritabanı şema dokümantasyonu
│
├── .gitignore
└── README.md

## Teknoloji Detayları

### Backend Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Tip güvenliği
- **PostgreSQL**: İlişkisel veritabanı
- **pg (node-postgres)**: PostgreSQL client
- **bcryptjs**: Şifre hashleme
- **jsonwebtoken**: JWT authentication
- **express-validator**: Veri doğrulama

### Frontend Stack
- **Next.js 14+**: React framework (App Router)
- **TypeScript**: Tip güvenliği
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client
- **Zustand**: State management
- **React Hook Form**: Form yönetimi
- **date-fns**: Tarih/saat işlemleri
- **Lucide React**: İkon kütüphanesi

### Database
- **PostgreSQL 15+**
  - JSONB: Esnek kullanıcı profilleri
  - PostGIS: Konum servisleri (gelecekte)
  - Exclusion Constraints: Çifte rezervasyon engelleme

## Geliştirme İlkeleri

1. **Modüler Yapı**: Her modül kendi sorumluluğunda
2. **Type Safety**: TypeScript ile tam tip güvenliği
3. **RESTful API**: Standart HTTP metodları
4. **Clean Code**: Okunabilir ve sürdürülebilir kod
5. **Error Handling**: Merkezi hata yönetimi
6. **Security**: JWT, bcrypt, input validation
