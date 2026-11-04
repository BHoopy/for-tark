import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { usersQueryKeys } from "./users-query-keys";

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
    const sql = getSql();

    if (action === "add") {
      await sql`
        UPDATE users
        SET favorite_tournaments = CASE
          WHEN ${tournamentId} = ANY(COALESCE(favorite_tournaments, '{}'))
            THEN favorite_tournaments
          ELSE array_append(COALESCE(favorite_tournaments, '{}'), ${tournamentId})
        END,
            updated_at = NOW()
        WHERE uid = ${userId} OR id = ${userId}
      `;
    } else {
      await sql`
        UPDATE users
        SET favorite_tournaments = array_remove(COALESCE(favorite_tournaments, '{}'), ${tournamentId}),
            updated_at = NOW()
        WHERE uid = ${userId} OR id = ${userId}
      `;
    }
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
