import { unstable_cache } from "next/cache";
import { getSql } from "@/lib/neon";

/**
 * Cache tag used for every page of the public tournament list.
 *
 * Mutations that change what the list shows (create/update/delete a
 * tournament, regenerate fixtures, save a score) call `revalidateTag` with
 * this value so the next request reads fresh data from Postgres.
 */
export const TOURNAMENTS_CACHE_TAG = "tournaments";

export type TournamentListItem = {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  format: string;
  matchType: string | null;
  status: string;
  createdBy: string;
  createdAt: string | null;
  coverImageUrl: string | null;
  numberOfTeams: number | null;
  moderators: string[];
  fixtures: unknown[];
};

export type TournamentPage = {
  tournaments: TournamentListItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageLimit: number;
};

async function fetchTournamentPage(
  page: number,
  pageLimit: number,
): Promise<TournamentPage> {
  const sql = getSql();

  const countRows = (await sql`
    SELECT COUNT(*)::int AS count FROM psimply.tournaments
  `) as { count: number }[];
  const totalCount = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(totalCount / pageLimit);

  const offset = (page - 1) * pageLimit;
  const rows = (await sql`
    SELECT id, name, description, rules, format, match_type, status,
           created_by, created_at, updated_at, cover_image_url,
           number_of_teams, moderators, fixtures
    FROM psimply.tournaments
    ORDER BY created_at DESC
    LIMIT ${pageLimit} OFFSET ${offset}
  `) as Record<string, any>[];

  const tournaments = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    rules: r.rules,
    format: r.format,
    matchType: r.match_type,
    status: r.status,
    createdBy: r.created_by,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    coverImageUrl: r.cover_image_url,
    numberOfTeams: r.number_of_teams,
    moderators: r.moderators ?? [],
    fixtures: r.fixtures ?? [],
  }));

  return { tournaments, totalCount, totalPages, page, pageLimit };
}

/**
 * Cached per (page, pageLimit). The `revalidate` value is only a safety net:
 * normal freshness comes from `revalidateTag(TOURNAMENTS_CACHE_TAG)` in the
 * server actions that mutate tournaments.
 */
export const getTournamentPage = unstable_cache(
  fetchTournamentPage,
  ["paginated-tournaments"],
  { tags: [TOURNAMENTS_CACHE_TAG], revalidate: 60 },
);
