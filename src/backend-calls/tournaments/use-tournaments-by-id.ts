import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { getTournamentById } from "@/lib/server-actions/tournaments";

type Props = {
  id: string;
  refetchInterval?: number;
};

export function useTournamentsById({ id, refetchInterval }: Props) {
  async function getTournamentsByIdFn(id: string): Promise<tournamentBody> {
    const tournament = await getTournamentById(id);
    return {
      ...tournament,
      createdAt: tournament.createdAt
        ? new Date(tournament.createdAt)
        : new Date(),
    } as tournamentBody;
  }

  return useQuery({
    queryKey: tournamentsQueryKeys.tournament(id),
    queryFn: () => getTournamentsByIdFn(id),
    refetchInterval: refetchInterval ?? 0,
    enabled: !!id,
  });
}
