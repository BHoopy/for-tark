import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { getUserTournaments } from "@/lib/server-actions/tournaments";

type Props = {
  userId?: string;
};

export function useUserTournaments({ userId }: Props = {}) {
  async function getUserTournamentsFn(): Promise<tournamentBody[]> {
    if (!userId) return [];

    const rows = await getUserTournaments(userId);

    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    })) as tournamentBody[];
  }

  return useQuery<tournamentBody[]>({
    queryKey: tournamentsQueryKeys.userTournaments(userId),
    queryFn: getUserTournamentsFn,
    enabled: !!userId,
    throwOnError: true,
  });
}
