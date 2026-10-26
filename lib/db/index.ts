import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { databaseUrl } from './url';

// Enable WebSocket for serverless environments when supported
if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

let poolInstance: Pool | null = null;

export function getDbPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  poolInstance = new Pool({
    connectionString: databaseUrl(),
    max: 25,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  });

  return poolInstance;
}

export function getDb() {
  const pool = getDbPool();
  return drizzle(pool, { schema });
}

export { schema };
