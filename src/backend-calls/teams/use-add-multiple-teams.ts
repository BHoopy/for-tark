import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";
import { addTeams } from "@/lib/server-actions/teams";

interface Props {
  tournamentId: string;
}

export function useAddMultipleTeams({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const addMultipleTeamsFn = async (teams: Omit<teamBody, "id">[]) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");
    await addTeams(tournamentId, teams);
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
