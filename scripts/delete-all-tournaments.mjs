#!/usr/bin/env node
/**
 * Delete every tournament from the psimply schema.
 *
 * Related rows (teams, matches, comments) are removed automatically by the
 * `ON DELETE CASCADE` foreign keys. Tournament ids are also cleared from
 * `psimply.users.favorite_tournaments` unless `--keep-favorites` is passed.
 *
 * The script is a dry run by default: it only prints what would be deleted.
 * Pass `--yes` (or `-y`) to actually delete the data.
 *
 * Usage:
 *   node scripts/delete-all-tournaments.mjs            # dry run
 *   node scripts/delete-all-tournaments.mjs --yes      # delete everything
 *   node scripts/delete-all-tournaments.mjs --yes --keep-favorites
 */

import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Load environment files in the same order Next.js does (later files do not
// override values that are already set).
for (const file of [".env.local", ".env", ".dev.vars"]) {
  config({ path: path.resolve(process.cwd(), file) });
}

const args = new Set(process.argv.slice(2));
const confirmed = args.has("--yes") || args.has("-y");
const keepFavorites = args.has("--keep-favorites");

if (args.has("--help") || args.has("-h")) {
  console.log(
    [
      "Delete all tournaments from the psimply schema.",
      "",
      "Usage:",
      "  node scripts/delete-all-tournaments.mjs              Dry run (default)",
      "  node scripts/delete-all-tournaments.mjs --yes        Delete everything",
      "",
      "Options:",
      "  -y, --yes            Actually perform the deletion",
      "  --keep-favorites     Do not clear users' favorite tournaments",
      "  -h, --help           Show this help",
    ].join("\n"),
  );
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local, .env, or .dev.vars.",
  );
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  const [tournamentCount] = await sql`
    SELECT COUNT(*)::int AS count FROM psimply.tournaments
  `;
  const total = tournamentCount?.count ?? 0;

  const [related] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM psimply.teams)    AS teams,
      (SELECT COUNT(*)::int FROM psimply.matches)  AS matches,
      (SELECT COUNT(*)::int FROM psimply.comments) AS comments
  `;

  console.log(`Found ${total} tournament(s) in psimply.tournaments.`);
  console.log(
    `Related rows that will cascade: ${related.teams} team(s), ` +
      `${related.matches} match(es), ${related.comments} comment(s).`,
  );

  if (total === 0) {
    console.log("Nothing to delete.");
    return;
  }

  const preview = await sql`
    SELECT id, name
    FROM psimply.tournaments
    ORDER BY created_at DESC
    LIMIT 10
  `;

  console.log("\nMost recent tournaments:");
  for (const row of preview) {
    console.log(`  - ${row.name} (${row.id})`);
  }
  if (total > preview.length) {
    console.log(`  ... and ${total - preview.length} more`);
  }

  if (!confirmed) {
    console.log(
      "\nDry run only. Re-run with --yes to permanently delete these tournaments.",
    );
    return;
  }

  const [deletedResult, favoritesResult] = await sql.transaction([
    sql`
      WITH deleted AS (DELETE FROM psimply.tournaments RETURNING id)
      SELECT COUNT(*)::int AS count FROM deleted
    `,
    keepFavorites
      ? sql`SELECT 0::int AS count`
      : sql`
          WITH cleared AS (
            UPDATE psimply.users
            SET favorite_tournaments = '{}', updated_at = NOW()
            WHERE COALESCE(cardinality(favorite_tournaments), 0) > 0
            RETURNING id
          )
          SELECT COUNT(*)::int AS count FROM cleared
        `,
  ]);

  const deleted = deletedResult[0]?.count ?? 0;
  const clearedFavorites = favoritesResult[0]?.count ?? 0;

  console.log(`\nDeleted ${deleted} tournament(s).`);
  if (!keepFavorites) {
    console.log(`Cleared favorites for ${clearedFavorites} user(s).`);
  }
}

main().catch((error) => {
  console.error("Failed to delete tournaments:", error);
  process.exit(1);
});
