import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useTranslations } from "next-intl";
import { deleteTournament } from "@/lib/server-actions/tournaments";

interface Props {
  router: AppRouterInstance;
  closeModal: () => void;
  locale: string;
}

export function useDeleteTournament({ router, closeModal, locale }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const deleteTournamentFn = async (id: string) => {
    await deleteTournament(id);
  };

  return useMutation({
    mutationFn: deleteTournamentFn,
    onSuccess: () => {
      toast({
        title: t("toast.delete-tournament-success.title"),
        description: t("toast.delete-tournament-success.description"),
      });
      queryClient.invalidateQueries({ queryKey: tournamentsQueryKeys.all });
      router.push(`/${locale}/user/`);
      closeModal();
    },
    onError: () => {
      toast({
        title: t("toast.delete-tournament-fail.title"),
        description: t("toast.delete-tournament-fail.description"),
        variant: "destructive",
      });
    },
  });
}
