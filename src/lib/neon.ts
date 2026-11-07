import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon (Postgres) client for the eFut tournament app.
 *
 * The connection string is read from the server-only `DATABASE_URL`
 * environment variable. Configure it in `.env.local` (local development)
 * or in Netlify's environment variables (marked as a secret).
 */

const connectionString =
  (typeof process !== "undefined" && process.env?.DATABASE_URL) || "";

let cached: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Set DATABASE_URL in .dev.vars / .env.local.",
    );
  }
  if (!cached) {
    cached = neon(connectionString);
    // The Neon HTTP driver runs each query in its own connection, so
    // `SET search_path` does not persist. Qualify tables explicitly
    // (e.g. `psimply.tournaments`) to avoid conflicts with other apps
    // that share this database.
  }
  return cached;
}


export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  return getSql()(strings, ...values);
};

export type Sql = NeonQueryFunction<false, false>;
