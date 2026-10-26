import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { directDatabaseUrl } from './lib/db/url';

config({ path: '.env.local' });
config();

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ? directDatabaseUrl() : '',
  },
});
