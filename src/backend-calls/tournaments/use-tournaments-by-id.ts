import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { getSql } from "@/lib/neon";

type Props = {
  id: string;
  refetchInterval?: number;
};

export function useTournamentsById({ id, refetchInterval }: Props) {
  async function getTournamentsByIdFn(id: string) {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, description, rules, format, match_type, status, created_by, created_at, updated_at, cover_image_url, number_of_teams, moderators, fixtures
      FROM tournaments
      WHERE id = ${id}
      LIMIT 1
    `) as any[];

    if (!rows || rows.length === 0) {
      throw new Error("Tournament not found");
    }

    const r = rows[0];
    const tournament = {
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
    };
    return tournament as tournamentBody;
  }
  return useQuery({
    queryKey: tournamentsQueryKeys.tournament(id),
    queryFn: () => getTournamentsByIdFn(id),
    refetchInterval: refetchInterval ?? 0,
    enabled: !!id,
  });
}