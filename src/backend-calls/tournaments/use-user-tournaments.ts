import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { getSql } from "@/lib/neon";

type Props = {
  userId?: string;
};

export function useUserTournaments({ userId }: Props = {}) {
  async function getUserTournamentsFn(): Promise<tournamentBody[]> {
    if (!userId) return [];

    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, description, rules, format, match_type, status, created_by, created_at, updated_at, cover_image_url, number_of_teams, moderators, fixtures
      FROM tournaments
      WHERE created_by = ${userId}
      ORDER BY created_at DESC
    `) as any[];

    return rows.map((r: any) => ({
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
  }

  return useQuery<tournamentBody[]>({
    queryKey: tournamentsQueryKeys.userTournaments(userId),
    queryFn: getUserTournamentsFn,
    enabled: !!userId,
    throwOnError: true,
  });
}