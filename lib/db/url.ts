function requireDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env.');
  }
  return connectionString;
}

/** Pooled Neon URL for application queries. */
export function databaseUrl(): string {
  return requireDatabaseUrl();
}

/**
 * Direct Neon URL for DDL. Drops the `-pooler` host suffix so migrations
 * skip PgBouncer, which cannot hold session state.
 */
export function directDatabaseUrl(): string {
  const pooled = requireDatabaseUrl();
  const url = new URL(pooled);
  url.hostname = url.hostname.replace('-pooler', '');
  return url.toString();
}
