import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useUpdateTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const updateTeamFn = async (team: teamBody) => {
    if (!tournamentId || !team.id)
      throw new Error("Tournament ID or Team ID is missing.");

    const sql = getSql();
    if (team.name !== undefined) {
      await sql`
        UPDATE teams SET name = ${team.name}
        WHERE id = ${team.id} AND tournament_id = ${tournamentId}
      `;
    }
    if (team.color !== undefined) {
      await sql`
        UPDATE teams SET color = ${team.color}
        WHERE id = ${team.id} AND tournament_id = ${tournamentId}
      `;
    }
    if (team.roster !== undefined) {
      await sql`
        UPDATE teams SET roster = ${team.roster}
        WHERE id = ${team.id} AND tournament_id = ${tournamentId}
      `;
    }
    if (team.logo !== undefined) {
      await sql`
        UPDATE teams SET logo = ${team.logo}
        WHERE id = ${team.id} AND tournament_id = ${tournamentId}
      `;
    }
  };

  return useMutation({
    mutationFn: updateTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("team-update-success.title"),
        description: t("team-update-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("team-update-fail.title"),
        description:
          (error as Error).message || t("team-update-fail.description"),
        variant: "destructive",
      });
    },
  });
}