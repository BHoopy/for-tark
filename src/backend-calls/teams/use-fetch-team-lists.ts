import { useQuery } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { TeamList } from "@/types/types";
import { usersQueryKeys } from "../users";

export function useFetchTeamLists(userId?: string) {
  const fetchTeamListsFn = async (): Promise<TeamList[]> => {
    if (!userId) {
      return [];
    }

    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, teams
      FROM team_lists
      ORDER BY name ASC
    `) as any[];

    return (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      teams: r.teams ?? [],
    })) as TeamList[];
  };

  return useQuery({
    queryKey: usersQueryKeys.teamLists(userId),
    queryFn: fetchTeamListsFn,
    enabled: !!userId,
  });
}