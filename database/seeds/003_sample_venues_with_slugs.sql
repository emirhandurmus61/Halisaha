-- Düzeltilmiş Örnek Tesisler ve Sahalar (Slug Dahil)

-- Tesis 1: Beşiktaş Spor Kompleksi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Beşiktaş Spor Kompleksi',
  'besiktas-spor-kompleksi',
  'Modern tesisler ve geniş park alanı. 3 adet halı saha, kafeterya, soyunma odaları.',
  'İstanbul',
  'Beşiktaş',
  'Abbasağa Mahallesi, Spor Sokak No:12, Beşiktaş/İstanbul',
  '0212 555 0101',
  500
);

-- Beşiktaş Spor Kompleksi - Sahalar
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Saha A (Büyük)', '11 vs 11', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'besiktas-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Saha B (Orta)', '7 vs 7', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'besiktas-spor-kompleksi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Saha C (Küçük)', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'besiktas-spor-kompleksi';

-- Tesis 2: Kadıköy Arena
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Kadıköy Arena',
  'kadikoy-arena',
  'Kapalı halı saha kompleksi. Klimalı, LED aydınlatma, özel soyunma odaları.',
  'İstanbul',
  'Kadıköy',
  'Moda Mahallesi, Arena Caddesi No:45, Kadıköy/İstanbul',
  '0216 555 0202',
  550
);

-- Kadıköy Arena - Sahalar
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '8 vs 8', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'kadikoy-arena';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Yan Saha', '5 vs 5', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'kadikoy-arena';

-- Tesis 3: Sarıyer Yeşil Alan
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Sarıyer Yeşil Alan',
  'sariyer-yesil-alan',
  'Doğa içinde halı saha deneyimi. Ağaçlarla çevrili, teras kafeterya.',
  'İstanbul',
  'Sarıyer',
  'Bahçeköy Mahallesi, Orman Yolu No:78, Sarıyer/İstanbul',
  '0212 555 0303',
  450
);

-- Sarıyer Yeşil Alan - Saha
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Orman Sahası', '7 vs 7', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'sariyer-yesil-alan';

-- Tesis 4: Şişli Premium
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Şişli Premium Halı Saha',
  'sisli-premium-hali-saha',
  'Lüks tesis, valet park, duş kabinleri, spor malzeme kiralama.',
  'İstanbul',
  'Şişli',
  'Mecidiyeköy Mahallesi, Premium Plaza No:23, Şişli/İstanbul',
  '0212 555 0404',
  650
);

-- Şişli Premium - Saha
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'VIP Saha', '6 vs 6', 'Sentetik Çim Premium', true, true
FROM venues WHERE slug = 'sisli-premium-hali-saha';

-- Tesis 5: Üsküdar Spor Merkezi
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Üsküdar Spor Merkezi',
  'uskudar-spor-merkezi',
  'Aile dostu tesis. Çocuk oyun alanı, geniş otoparkı.',
  'İstanbul',
  'Üsküdar',
  'Altunizade Mahallesi, Spor Caddesi No:67, Üsküdar/İstanbul',
  '0216 555 0505',
  400
);

-- Üsküdar Spor Merkezi - Sahalar
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Ana Saha', '8 vs 8', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'uskudar-spor-merkezi';

INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Mini Saha', '3 vs 3', 'Sentetik Çim', true, true
FROM venues WHERE slug = 'uskudar-spor-merkezi';

-- Tesis 6: Maltepe Sahil Spor
INSERT INTO venues (owner_id, name, slug, description, city, district, address, phone, base_price_per_hour)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Maltepe Sahil Spor',
  'maltepe-sahil-spor',
  'Deniz manzaralı halı saha. Sahil kenarında, açık hava deneyimi.',
  'İstanbul',
  'Maltepe',
  'Cevizli Mahallesi, Sahil Yolu No:156, Maltepe/İstanbul',
  '0216 555 0606',
  480
);

-- Maltepe Sahil Spor - Saha
INSERT INTO fields (venue_id, name, field_type, surface_type, has_lighting, has_roof)
SELECT id, 'Sahil Sahası', '7 vs 7', 'Sentetik Çim', true, false
FROM venues WHERE slug = 'maltepe-sahil-spor';

-- Sonuç kontrolü
SELECT
  v.name as tesis_adi,
  v.district as ilce,
  COUNT(f.id) as saha_sayisi,
  v.base_price_per_hour as baslangic_fiyat
FROM venues v
LEFT JOIN fields f ON v.id = f.venue_id
GROUP BY v.id, v.name, v.district, v.base_price_per_hour
ORDER BY v.created_at DESC;

-- Toplam özet
SELECT
  COUNT(DISTINCT v.id) as toplam_tesis,
  COUNT(f.id) as toplam_saha
FROM venues v
LEFT JOIN fields f ON v.id = f.venue_id;
