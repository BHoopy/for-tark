import { useQuery } from "@tanstack/react-query";
import { TeamList } from "@/types/types";
import { usersQueryKeys } from "../users";
import { getTeamLists } from "@/lib/server-actions/teams";

export function useFetchTeamLists(userId?: string) {
  const fetchTeamListsFn = async (): Promise<TeamList[]> => {
    if (!userId) {
      return [];
    }

    return getTeamLists();
  };

  return useQuery({
    queryKey: usersQueryKeys.teamLists(userId),
    queryFn: fetchTeamListsFn,
    enabled: !!userId,
  });
}
