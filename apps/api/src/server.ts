import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './lib/prisma.js';

async function bootstrap() {
  const app = createApp();

  // Test DB connection gracefully without blocking server startup in Phase 1
  if (env.DATABASE_URL) {
    console.log('[Database] Checking PostgreSQL connection...');
    const dbStatus = await checkDatabaseConnection();
    if (dbStatus.status === 'CONNECTED') {
      console.log('✓ [Database] Connected to PostgreSQL successfully.');
    } else {
      console.warn('! [Database] Connection warning:', dbStatus.error);
      console.warn('! [Database] Note: Running with in-memory foundation data provider.');
    }
  } else {
    console.log('ℹ [Database] DATABASE_URL not configured. Running in Phase 1 foundation mode.');
  }

  const server = app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`  SolveSphere AI — Backend API Server Started`);
    console.log(`  Port:        http://localhost:${env.PORT}`);
    console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`  V1 Endpoints: http://localhost:${env.PORT}/api/v1/...`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`====================================================`);
  });

  const handleShutdown = () => {
    console.log('\nGracefully shutting down SolveSphere API server...');
    server.close(() => {
      console.log('Server closed. Goodbye!');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal error during API bootstrap:', err);
  process.exit(1);
});
