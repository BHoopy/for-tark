import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";
import { addTeam } from "@/lib/server-actions/teams";

interface Props {
  tournamentId: string;
}

export function useAddTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const addTeamFn = async (team: Omit<teamBody, "id">) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");
    return addTeam(tournamentId, team);
  };

  return useMutation({
    mutationFn: addTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("toast.team-add-success.title"),
        description: t("toast.team-add-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.team-add-fail.title"),
        description:
          (error as Error).message || t("toast.team-add-fail.description"),
        variant: "destructive",
      });
    },
  });
}
