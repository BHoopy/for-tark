import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { tournamentBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { updateTournament } from "@/lib/server-actions/tournaments";

interface Props {
  id: string;
}

export function useEditTournament({ id }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const editTournamentFn = async (
    updatedTournament: Partial<tournamentBody>,
  ) => {
    await updateTournament(id, updatedTournament);
  };

  return useMutation({
    mutationFn: editTournamentFn,
    onSuccess: () => {
      toast({
        title: t("toast.edit-tournament-success.title"),
        description: t("toast.edit-tournament-success.description"),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(id),
      });
    },
    onError: (e) => {
      console.error(e);
      toast({
        title: t("toast.edit-tournament-fail.title"),
        description: t("toast.edit-tournament-fail.description"),
        variant: "destructive",
      });
    },
  });
}
