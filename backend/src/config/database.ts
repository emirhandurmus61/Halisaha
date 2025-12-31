import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'halisaha_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // Boşta bekleme süresi
  connectionTimeoutMillis: 2000, // Bağlantı timeout
};

// PostgreSQL bağlantı havuzu
export const pool = new Pool(poolConfig);

// Bağlantı test fonksiyonu
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    console.log('📅 Veritabanı zamanı:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL bağlantı hatası:', error);
    return false;
  }
};

// Veritabanı sorgu fonksiyonu (helper)
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Sorgu çalıştı:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Sorgu hatası:', error);
    throw error;
  }
};

// Graceful shutdown için bağlantıları kapat
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 PostgreSQL bağlantı havuzu kapatıldı');
};

// Process sonlandığında pool'u kapat
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
