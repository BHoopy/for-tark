import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { tournamentsQueryKeys } from "@/backend-calls";
import { useTranslations } from "next-intl";
import { createTournament } from "@/lib/server-actions/tournaments";

interface Props {
  router: AppRouterInstance;
  closeModal: () => void;
  locale: string;
}

export function useCreateTournament({ router, closeModal, locale }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  async function createTournamentFn(
    tournament: Omit<tournamentBody, "teams" | "fixtures">,
  ) {
    return createTournament({
      name: tournament.name,
      description: tournament.description,
      rules: tournament.rules,
      format: tournament.format,
      matchType: tournament.matchType,
      numberOfTeams: tournament.numberOfTeams,
      moderators: tournament.moderators,
    });
  }

  return useMutation({
    mutationFn: createTournamentFn,
    onSuccess: (data) => {
      toast({
        title: t("toast.create-tournament-success.title"),
        description: t("toast.create-tournament-success.description"),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.userTournaments(),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.pagination(1),
      });
      closeModal();
      router.push(`/${locale}/user/tournament/` + data.id);
    },
    onError: (error) => {
      const errorDetails =
        (error as any)?.response?.data?.details ||
        (error as any)?.response?.data?.error ||
        (error as any).message;
      toast({
        title: t("toast.create-tournament-fail.title"),
        description:
          errorDetails || t("toast.create-tournament-fail.description"),
        variant: "destructive",
      });
    },
  });
}
