-- Ek Şehirlerden Örnek Tesisler ve Sahalar

-- TRABZON TESİSLERİ

-- Tesis 1: Trabzon Şenol Güneş Spor Kompleksi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Trabzon Şenol Güneş Spor Kompleksi',
  'trabzon-senol-gunes-spor-kompleksi',
  'Modern tesisler, geniş park alanı, kafeterya. Trabzon''un en büyük halı saha kompleksi.',
  'Trabzon',
  'Ortahisar',
  'Çömlekçi Mahallesi, Stadyum Caddesi No:15, Ortahisar/Trabzon',
  '0462 555 0101',
  350
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '11 vs 11', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'trabzon-senol-gunes-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Orta Saha', '7 vs 7', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'trabzon-senol-gunes-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Mini Saha', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'trabzon-senol-gunes-spor-kompleksi';

-- Tesis 2: Akçaabat Arena
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Akçaabat Arena',
  'akcaabat-arena',
  'Kapalı halı saha. LED aydınlatma, özel soyunma odaları, duş imkanı.',
  'Trabzon',
  'Akçaabat',
  'Merkez Mahallesi, Arena Sokak No:8, Akçaabat/Trabzon',
  '0462 555 0201',
  300
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Kapalı Saha', '6 vs 6', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'akcaabat-arena';

-- Tesis 3: Yomra Spor Tesisi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Yomra Spor Tesisi',
  'yomra-spor-tesisi',
  'Doğa içinde spor deneyimi. Yeşilliklerle çevrili, manzaralı teras kafeterya.',
  'Trabzon',
  'Yomra',
  'Yalıncak Mahallesi, Spor Caddesi No:42, Yomra/Trabzon',
  '0462 555 0301',
  280
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Yeşil Saha', '7 vs 7', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'yomra-spor-tesisi';

-- ANKARA TESİSLERİ

-- Tesis 4: Çankaya Premium Halı Saha
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Çankaya Premium Halı Saha',
  'cankaya-premium-hali-saha',
  'Lüks tesis, valet park hizmeti, profesyonel aydınlatma sistemi.',
  'Ankara',
  'Çankaya',
  'Kavaklıdere Mahallesi, Premium Plaza No:12, Çankaya/Ankara',
  '0312 555 0401',
  550
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'VIP Saha', '8 vs 8', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'cankaya-premium-hali-saha';

-- Tesis 5: Keçiören Spor Kompleksi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Keçiören Spor Kompleksi',
  'kecioren-spor-kompleksi',
  'Geniş tesis. 3 adet saha, geniş otopark, cafeterya ve sosyal alan.',
  'Ankara',
  'Keçiören',
  'Kalaba Mahallesi, Spor Sokak No:56, Keçiören/Ankara',
  '0312 555 0501',
  400
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '11 vs 11', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'kecioren-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Orta Saha', '7 vs 7', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'kecioren-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Küçük Saha', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'kecioren-spor-kompleksi';

-- İZMİR TESİSLERİ

-- Tesis 6: Karşıyaka Sahil Spor
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Karşıyaka Sahil Spor',
  'karsiyaka-sahil-spor',
  'Deniz manzaralı, sahil kenarında modern tesis. Açık hava deneyimi.',
  'İzmir',
  'Karşıyaka',
  'Bostanlı Mahallesi, Sahil Yolu No:234, Karşıyaka/İzmir',
  '0232 555 0601',
  450
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Sahil Sahası', '8 vs 8', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'karsiyaka-sahil-spor';

-- Tesis 7: Bornova Arena
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Bornova Arena',
  'bornova-arena',
  'Kapalı halı saha kompleksi. Klimalı, LED aydınlatma, özel duş kabinleri.',
  'İzmir',
  'Bornova',
  'Erzene Mahallesi, Arena Caddesi No:89, Bornova/İzmir',
  '0232 555 0701',
  480
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '7 vs 7', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'bornova-arena';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Mini Saha', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'bornova-arena';

-- BURSA TESİSLERİ

-- Tesis 8: Nilüfer Spor Merkezi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Nilüfer Spor Merkezi',
  'nilufer-spor-merkezi',
  'Modern tesis, geniş park alanı, kafeterya ve sosyal tesisler.',
  'Bursa',
  'Nilüfer',
  'Görükle Mahallesi, Spor Caddesi No:45, Nilüfer/Bursa',
  '0224 555 0801',
  380
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '8 vs 8', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'nilufer-spor-merkezi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Kapalı Saha', '6 vs 6', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'nilufer-spor-merkezi';

-- Tesis 9: Osmangazi Premium
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Osmangazi Premium Halı Saha',
  'osmangazi-premium-hali-saha',
  'Lüks tesis. VIP soyunma odaları, profesyonel malzeme kiralama.',
  'Bursa',
  'Osmangazi',
  'Hamitler Mahallesi, Premium Sokak No:23, Osmangazi/Bursa',
  '0224 555 0901',
  520
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'VIP Saha', '7 vs 7', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'osmangazi-premium-hali-saha';

-- ANTALYa TESİSLERİ

-- Tesis 10: Muratpaşa Spor Kompleksi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Muratpaşa Spor Kompleksi',
  'muratpasa-spor-kompleksi',
  'Deniz manzaralı modern tesis. Geniş sosyal alanlar ve kafeterya.',
  'Antalya',
  'Muratpaşa',
  'Fener Mahallesi, Spor Caddesi No:78, Muratpaşa/Antalya',
  '0242 555 1001',
  420
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '11 vs 11', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'muratpasa-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Orta Saha', '7 vs 7', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'muratpasa-spor-kompleksi';

-- Tesis 11: Kepez Arena
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Kepez Arena',
  'kepez-arena',
  'Kapalı halı saha. Modern aydınlatma, klimalı ortam, özel soyunma odaları.',
  'Antalya',
  'Kepez',
  'Gündoğdu Mahallesi, Arena Sokak No:34, Kepez/Antalya',
  '0242 555 1101',
  380
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Kapalı Saha', '6 vs 6', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'kepez-arena';

-- ADANA TESİSLERİ

-- Tesis 12: Seyhan Spor Merkezi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Seyhan Spor Merkezi',
  'seyhan-spor-merkezi',
  'Geniş tesis, modern altyapı. 2 adet saha ve sosyal tesisler.',
  'Adana',
  'Seyhan',
  'Ziyapaşa Mahallesi, Stadyum Caddesi No:67, Seyhan/Adana',
  '0322 555 1201',
  320
);

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '8 vs 8', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'seyhan-spor-merkezi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Mini Saha', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'seyhan-spor-merkezi';

-- Sonuç kontrolü - Yeni eklenen tesisler
SELECT
  v.name as tesis_adi,
  v.city as sehir,
  v.district as ilce,
  COUNT(f.id) as saha_sayisi,
  v.base_price_per_hour as baslangic_fiyat
FROM venues v
LEFT JOIN fields f ON v.id = f.venue_id
WHERE v.slug IN (
  'trabzon-senol-gunes-spor-kompleksi',
  'akcaabat-arena',
  'yomra-spor-tesisi',
  'cankaya-premium-hali-saha',
  'kecioren-spor-kompleksi',
  'karsiyaka-sahil-spor',
  'bornova-arena',
  'nilufer-spor-merkezi',
  'osmangazi-premium-hali-saha',
  'muratpasa-spor-kompleksi',
  'kepez-arena',
  'seyhan-spor-merkezi'
)
GROUP BY v.id, v.name, v.city, v.district, v.base_price_per_hour
ORDER BY v.city, v.district;

-- Şehir bazlı özet
SELECT
  v.city as sehir,
  COUNT(DISTINCT v.id) as tesis_sayisi,
  COUNT(f.id) as toplam_saha_sayisi
FROM venues v
LEFT JOIN fields f ON v.id = f.venue_id
GROUP BY v.city
ORDER BY tesis_sayisi DESC;
