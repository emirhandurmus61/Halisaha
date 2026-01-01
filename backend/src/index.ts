import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import environment from './config/environment';
import { testConnection } from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import venueRoutes from './routes/venue.routes';
import reservationRoutes from './routes/reservation.routes';
import playerSearchRoutes from './routes/player-search.routes';
import teamRoutes from './routes/team.routes';
import opponentSearchRoutes from './routes/opponent-search.routes';
import adminRoutes from './routes/admin.routes';
import ratingRoutes from './routes/rating.routes';

dotenv.config();

const app: Application = express();
const PORT = environment.server.port;

// ====================================
// MIDDLEWARE
// ====================================

// CORS - Frontend'den gelen isteklere izin ver
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
if (environment.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ====================================
// ROUTES
// ====================================

// Health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Halısaha Yönetim ve Sosyal Ağı API',
    version: '1.0.0',
    environment: environment.server.nodeEnv,
  });
});

// API Routes
const apiPrefix = environment.server.apiPrefix;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/venues`, venueRoutes);
app.use(`${apiPrefix}/reservations`, reservationRoutes);
app.use(`${apiPrefix}/player-search`, playerSearchRoutes);
app.use(`${apiPrefix}/teams`, teamRoutes);
app.use(`${apiPrefix}/opponent-search`, opponentSearchRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/ratings`, ratingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route bulunamadı',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    error: environment.server.nodeEnv === 'development' ? err : {},
  });
});

// ====================================
// START SERVER
// ====================================

const startServer = async () => {
  try {
    // Veritabanı bağlantısını test et
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Veritabanı bağlantısı başarısız! Sunucu başlatılamıyor.');
      process.exit(1);
    }

    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log('\n================================');
      console.log('🚀 Halısaha API Sunucusu Başlatıldı');
      console.log('================================');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}${apiPrefix}`);
      console.log(`🌍 Ortam: ${environment.server.nodeEnv}`);
      console.log('================================\n');
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

startServer();

export default app;
