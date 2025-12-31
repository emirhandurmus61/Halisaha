# PgAdmin Bağlantı Ayarları

## Sorun: Veritabanını PgAdmin'de Göremiyorum

PostgreSQL sisteminizde **Port 5433**'te çalışıyor (varsayılan 5432 değil).

## Çözüm: PgAdmin'de Server Ekleyin

### Adım 1: PgAdmin'i Açın
1. PgAdmin uygulamasını başlatın
2. Master şifrenizi girin

### Adım 2: Yeni Server Ekleyin

1. Sol panelde **Servers** üzerine sağ tıklayın
2. **Register > Server** seçin

### Adım 3: Bağlantı Bilgilerini Girin

#### General Tab:
- **Name**: `Halisaha Local` (veya istediğiniz bir isim)

#### Connection Tab:
- **Host name/address**: `localhost`
- **Port**: `5433` ⚠️ (ÖNEMLİ: 5432 değil, 5433!)
- **Maintenance database**: `postgres`
- **Username**: `postgres`
- **Password**: `PgAdmin61`
- ✅ **Save password**: İşaretleyin (her seferinde şifre girmemek için)

#### SSL Tab:
- **SSL mode**: `Prefer` (veya `Disable`)

### Adım 4: Kaydet ve Bağlan

1. **Save** butonuna basın
2. Sol panelde yeni sunucu görünecek: `Halisaha Local`
3. Sunucuyu genişletin: **Halisaha Local > Databases**
4. `halisaha_db` veritabanını göreceksiniz ✅

## Veritabanı Bilgileri

```
Host: localhost
Port: 5433 ⚠️
Database: halisaha_db
Username: postgres
Password: PgAdmin61
```

## Veritabanı Başarıyla Oluşturuldu!

Terminal üzerinden şu komutla da kontrol edebilirsiniz:

```bash
PGPASSWORD=PgAdmin61 psql -U postgres -h localhost -p 5433 -d halisaha_db
```

## Sonraki Adım

Artık PgAdmin'de veritabanınızı görebilirsiniz. Bir sonraki adımda tabloları oluşturacağız!
