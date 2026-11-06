import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { tournamentsQueryKeys } from "../tournaments";
import { updateTournamentModerators } from "@/lib/server-actions/tournaments";

interface UseUpdateModeratorsProps {
  tournamentId: string;
}

interface UpdateModeratorsParams {
  userId: string;
  action: "add" | "remove";
}

export function useUpdateModerators({
  tournamentId,
}: UseUpdateModeratorsProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const updateModeratorsFn = async ({
    userId,
    action,
  }: UpdateModeratorsParams) => {
    await updateTournamentModerators(tournamentId, userId, action);
  };

  return useMutation({
    mutationFn: updateModeratorsFn,
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title:
          action === "add"
            ? t("moderator-add-success.title")
            : t("moderator-remove-success.title"),
        description:
          action === "add"
            ? t("moderator-add-success.description")
            : t("moderator-remove-success.description"),
      });
    },
    onError: (error, { action }) => {
      toast({
        title:
          action === "add"
            ? t("moderator-add-fail.title")
            : t("moderator-remove-fail.title"),
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
