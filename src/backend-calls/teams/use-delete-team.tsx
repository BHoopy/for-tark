import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useDeleteTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const deleteTeamFn = async (teamId: string) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");
    const sql = getSql();
    await sql`
      DELETE FROM teams
      WHERE id = ${teamId} AND tournament_id = ${tournamentId}
    `;
  };

  return useMutation({
    mutationFn: deleteTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("team-delete-success.title"),
        description: t("team-delete-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("team-delete-fail.title"),
        description:
          (error as Error).message || t("team-delete-fail.description"),
        variant: "destructive",
      });
    },
  });
}