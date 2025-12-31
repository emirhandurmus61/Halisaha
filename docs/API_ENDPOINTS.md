# Halısaha API Endpoints Dokümantasyonu

Base URL: `http://localhost:5000/api/v1`

## Authentication Endpoints

### 1. Kayıt Ol (Register)
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "05551234567",
  "userType": "player"  // "player", "venue_owner", "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Kayıt başarılı",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "userType": "player"
    },
    "token": "jwt-token-here"
  }
}
```

---

### 2. Giriş Yap (Login)
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "userType": "player"
    },
    "token": "jwt-token-here"
  }
}
```

---

### 3. Profil Bilgisi (Get Profile)
```
GET /api/v1/auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "phone": "05551234567",
    "userType": "player",
    "profileData": {},
    "trustScore": 100,
    "eloRating": 1000,
    "totalMatchesPlayed": 0,
    "currentStreak": 0,
    "longestStreak": 0,
    "badges": [],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## User Endpoints

### 4. Tüm Kullanıcıları Listele
```
GET /api/v1/users
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

---

### 5. Kullanıcı Detayı
```
GET /api/v1/users/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

---

## Venue Endpoints

### 6. Tüm Tesisleri Listele
```
GET /api/v1/venues
GET /api/v1/venues?city=İstanbul
GET /api/v1/venues?city=İstanbul&district=Kadıköy
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kadıköy Spor Sahaları",
      "slug": "kadikoy-spor-sahalari",
      "description": "Modern halısaha tesisleri",
      "address": "...",
      "city": "İstanbul",
      "district": "Kadıköy",
      "phone": "02161234567",
      "cover_image": "https://...",
      "base_price_per_hour": 500.00,
      "average_rating": 4.5,
      "total_reviews": 120,
      "is_active": true,
      "owner_name": "Mehmet Demir"
    }
  ],
  "count": 1
}
```

---

### 7. Tesis Detayı
```
GET /api/v1/venues/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Kadıköy Spor Sahaları",
    ...
    "fields": [
      {
        "id": "uuid",
        "name": "Saha 1",
        "field_type": "7v7",
        "surface_type": "artificial_grass",
        "has_lighting": true,
        "has_roof": false,
        "is_active": true
      }
    ]
  }
}
```

---

### 8. Yeni Tesis Oluştur (Sadece venue_owner/admin)
```
POST /api/v1/venues
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Yeni Tesis",
  "slug": "yeni-tesis",
  "description": "Açıklama",
  "address": "Tam adres",
  "city": "İstanbul",
  "district": "Beşiktaş",
  "phone": "02161234567",
  "basePricePerHour": 600.00
}
```

---

## Reservation Endpoints

### 9. Rezervasyonları Listele (Kullanıcının Kendi Rezervasyonları)
```
GET /api/v1/reservations
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "field_id": "uuid",
      "user_id": "uuid",
      "reservation_date": "2025-01-15",
      "start_time": "20:00:00",
      "end_time": "21:00:00",
      "total_price": 600.00,
      "status": "confirmed",
      "payment_status": "paid",
      "field_name": "Saha 1",
      "venue_name": "Kadıköy Spor Sahaları"
    }
  ],
  "count": 1
}
```

---

### 10. Rezervasyon Detayı
```
GET /api/v1/reservations/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

---

### 11. Yeni Rezervasyon Oluştur
```
POST /api/v1/reservations
```

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "fieldId": "uuid",
  "reservationDate": "2025-01-15",
  "startTime": "20:00",
  "endTime": "21:00",
  "basePrice": 600.00,
  "totalPrice": 600.00,
  "teamName": "Yıldızlar Takımı"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rezervasyon başarıyla oluşturuldu",
  "data": {...}
}
```

**Error (409 - Çifte Rezervasyon):**
```json
{
  "success": false,
  "message": "Bu saat aralığı için zaten bir rezervasyon bulunmaktadır",
  "error": "OVERLAPPING_RESERVATION"
}
```

---

### 12. Müsait Saatleri Getir
```
GET /api/v1/reservations/available-slots?fieldId=uuid&date=2025-01-15
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "bookedSlots": [
      {
        "start_time": "20:00:00",
        "end_time": "21:00:00"
      },
      {
        "start_time": "21:00:00",
        "end_time": "22:00:00"
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Gerekli alanlar eksik"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Erişim token'ı bulunamadı"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Bu işlem için yetkiniz bulunmamaktadır"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Kayıt bulunamadı"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Sunucu hatası",
  "error": {}
}
```

---

## Test Örnekleri (curl)

### Kayıt Ol
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Giriş Yap
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Profil Bilgisi
```bash
curl http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Tesisleri Listele
```bash
curl http://localhost:5000/api/v1/venues
```
