import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useAddMultipleTeams({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const addMultipleTeamsFn = async (teams: Omit<teamBody, "id">[]) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");

    const sql = getSql();
    for (const team of teams) {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO teams (id, tournament_id, name, color, roster, logo)
        VALUES (
          ${id},
          ${tournamentId},
          ${team.name},
          ${team.color ?? null},
          ${team.roster ?? []},
          ${team.logo || "/Play.png"}
        )
      `;
    }
  };

  return useMutation({
    mutationFn: addMultipleTeamsFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("load-team-list-success.title"),
        description: t("load-team-list-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("load-team-list-fail.title"),
        description:
          (error as Error).message || t("load-team-list-fail.description"),
        variant: "destructive",
      });
    },
  });
}