import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon (Postgres) client for the eFut tournament app.
 *
 * The connection string is read from `DATABASE_URL` (server-side) or
 * `NEXT_PUBLIC_DATABASE_URL` (client-side). Configure it in `.dev.vars` /
 * `.env.local`:
 *
 *   DATABASE_URL=postgresql://neondb_owner:npg_F9PQpr2ndchE@ep-purple-frost-aqfn5755-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
 */

const connectionString =
  (typeof process !== "undefined" && process.env?.DATABASE_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DATABASE_URL) ||
  "";

let cached: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Set DATABASE_URL in .dev.vars / .env.local.",
    );
  }
  if (!cached) {
    cached = neon(connectionString);
    // Use psimply schema to avoid conflicts with other apps sharing same DB
    cached`SET search_path TO psimply, public`.catch(() => {});
  }
  return cached;
}


export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  return getSql()(strings, ...values);
};

export type Sql = NeonQueryFunction<false, false>;
