
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getFirestore,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
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
  const db = getFirestore(app);

  const updateFavoritesFn = async ({
    tournamentId,
    action,
  }: UpdateFavoritesParams) => {
    const userRef = doc(db, "users", userId);

    if (action === "add") {
      return updateDoc(userRef, {
        favoriteTournaments: arrayUnion(tournamentId),
      });
    } else {
      return updateDoc(userRef, {
        favoriteTournaments: arrayRemove(tournamentId),
      });
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
