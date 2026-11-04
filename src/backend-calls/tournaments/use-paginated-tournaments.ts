import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { getSql } from "@/lib/neon";

type Props = {
  page: number;
  pageLimit: number;
};

type Response = {
  tournaments: tournamentBody[];
  totalPages: number;
};

export function usePaginatedTournaments({ page, pageLimit }: Props) {
  async function getPaginatedTournamentsFn(
    page: number,
  ): Promise<Response> {
    const sql = getSql();

    const countRows = (await sql`SELECT COUNT(*)::int AS count FROM tournaments`) as any[];
    const totalCount = Number(countRows[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageLimit);

    const offset = (page - 1) * pageLimit;
    const rows = (await sql`
      SELECT id, name, description, rules, format, match_type, status, created_by, created_at, updated_at, cover_image_url, number_of_teams, moderators, fixtures
      FROM tournaments
      ORDER BY created_at DESC
      LIMIT ${pageLimit} OFFSET ${offset}
    `) as any[];

    const tournaments = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      rules: r.rules,
      format: r.format,
      matchType: r.match_type,
      status: r.status,
      createdBy: r.created_by,
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      coverImageUrl: r.cover_image_url,
      numberOfTeams: r.number_of_teams,
      moderators: r.moderators ?? [],
      fixtures: r.fixtures ?? [],
    })) as tournamentBody[];

    return { tournaments, totalPages };
  }

  return useQuery<Response>({
    queryKey: tournamentsQueryKeys.pagination(page),
    queryFn: () => getPaginatedTournamentsFn(page),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}