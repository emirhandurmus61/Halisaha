import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  server: {
    port: number;
    nodeEnv: string;
    apiPrefix: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

const environment: EnvironmentConfig = {
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'halisaha_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Kritik ortam değişkenlerini kontrol et
const validateEnvironment = (): void => {
  const requiredEnvVars = ['DB_PASSWORD', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    console.warn(
      '⚠️  Eksik ortam değişkenleri:',
      missingEnvVars.join(', ')
    );
    console.warn('⚠️  Lütfen .env dosyanızı kontrol edin!');
  }
};

validateEnvironment();

export default environment;
