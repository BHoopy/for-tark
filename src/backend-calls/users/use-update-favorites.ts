import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { usersQueryKeys } from "./users-query-keys";
import { updateUserFavorites } from "@/lib/server-actions/users";

interface UseUpdateFavoritesProps {
  userId: string;
}

interface UpdateFavoritesParams {
  tournamentId: string;
  action: "add" | "remove";
}

export function useUpdateFavorites({ userId }: UseUpdateFavoritesProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const updateFavoritesFn = async ({
    tournamentId,
    action,
  }: UpdateFavoritesParams) => {
    await updateUserFavorites(userId, tournamentId, action);
  };

  return useMutation({
    mutationFn: updateFavoritesFn,
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.user(userId),
      });
      toast({
        title:
          action === "add"
            ? t("favorite-add-success.title")
            : t("favorite-remove-success.title"),
        description:
          action === "add"
            ? t("favorite-add-success.description")
            : t("favorite-remove-success.description"),
      });
    },
    onError: (error, { action }) => {
      toast({
        title:
          action === "add"
            ? t("favorite-add-fail.title")
            : t("favorite-remove-fail.title"),
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
