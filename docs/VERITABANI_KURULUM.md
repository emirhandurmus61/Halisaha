# PostgreSQL Veritabanı Kurulum Rehberi

## Adım 1: PgAdmin'i Açın

1. PgAdmin uygulamasını başlatın
2. Master şifrenizi girin (PgAdmin61)

## Adım 2: Veritabanını Oluşturun

### Yöntem 1: SQL Query ile (Önerilen)

1. PgAdmin'de sol panelden **PostgreSQL sunucunuza** sağ tıklayın
2. **Query Tool** seçeneğini seçin
3. `database/CREATE_DATABASE.sql` dosyasını açın
4. SQL komutlarını kopyalayıp Query Tool'a yapıştırın
5. **Execute (F5)** butonuna basın

### Yöntem 2: GUI ile

1. PgAdmin'de sol panelden **Databases** üzerine sağ tıklayın
2. **Create > Database** seçin
3. Aşağıdaki bilgileri girin:
   - **Database**: `halisaha_db`
   - **Owner**: `postgres`
   - **Encoding**: `UTF8`
   - **Collation**: `tr_TR.UTF-8`
4. **Save** butonuna basın

## Adım 3: UUID Uzantısını Aktifleştirin

1. Yeni oluşturulan `halisaha_db` veritabanına sağ tıklayın
2. **Query Tool** açın
3. Şu komutu çalıştırın:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Adım 4: Bağlantıyı Test Edin

Backend klasöründe bağımlılıkları yükledikten sonra:

```bash
cd backend
npm install
npm run dev
```

Konsol çıktısında şunu görmelisiniz:
```
✅ PostgreSQL bağlantısı başarılı!
```

## Bağlantı Bilgileri

Backend `.env` dosyasındaki ayarlar:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=halisaha_db
DB_USER=postgres
DB_PASSWORD=PgAdmin61
```

## Olası Sorunlar ve Çözümler

### Problem 1: "password authentication failed"

**Çözüm**: `.env` dosyasındaki `DB_PASSWORD` değerinin doğru olduğundan emin olun.

### Problem 2: "database does not exist"

**Çözüm**: Yukarıdaki adımları takip ederek `halisaha_db` veritabanını oluşturun.

### Problem 3: "FATAL: role does not exist"

**Çözüm**: `.env` dosyasındaki `DB_USER` değerini kontrol edin. Varsayılan olarak `postgres` olmalı.

### Problem 4: Port 5432 kullanımda değil

**Çözüm**: PostgreSQL'in hangi portta çalıştığını kontrol edin:
```bash
sudo netstat -plunt | grep postgres
```

Farklı bir port kullanıyorsa (örn: 5433), `.env` dosyasındaki `DB_PORT` değerini güncelleyin.

## Sonraki Adım

Veritabanı oluşturulduktan sonra, **Adım 3: Veritabanı Şeması ve Tabloları Oluşturma** adımına geçin.
