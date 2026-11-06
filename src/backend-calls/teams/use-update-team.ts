import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";
import { updateTeam } from "@/lib/server-actions/teams";

interface Props {
  tournamentId: string;
}

export function useUpdateTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const updateTeamFn = async (team: teamBody) => {
    if (!tournamentId || !team.id) {
      throw new Error("Tournament ID or Team ID is missing.");
    }
    await updateTeam(tournamentId, team);
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
