import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";

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
    const params = new URLSearchParams({
      page: String(page),
      pageLimit: String(pageLimit),
    });

    const response = await fetch(`/api/tournaments?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to load tournaments (${response.status})`);
    }

    const data = (await response.json()) as {
      tournaments: (Omit<tournamentBody, "createdAt"> & {
        createdAt: string | null;
      })[];
      totalPages: number;
    };

    const tournaments = data.tournaments.map((tournament) => ({
      ...tournament,
      createdAt: tournament.createdAt
        ? new Date(tournament.createdAt)
        : new Date(),
    })) as tournamentBody[];

    return { tournaments, totalPages: data.totalPages };
  }

  return useQuery<Response>({
    queryKey: [...tournamentsQueryKeys.pagination(page), pageLimit],
    queryFn: () => getPaginatedTournamentsFn(page),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
