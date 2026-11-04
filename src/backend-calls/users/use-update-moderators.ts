
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc, arrayUnion, arrayRemove, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { tournamentsQueryKeys } from "../tournaments";

interface UseUpdateModeratorsProps {
  tournamentId: string;
}

interface UpdateModeratorsParams {
  userId: string;
  action: "add" | "remove";
}

export function useUpdateModerators({ tournamentId }: UseUpdateModeratorsProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const updateModeratorsFn = async ({ userId, action }: UpdateModeratorsParams) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    
    if (action === "add") {
      return updateDoc(tournamentRef, {
        moderators: arrayUnion(userId)
      });
    } else {
      return updateDoc(tournamentRef, {
        moderators: arrayRemove(userId)
      });
    }
  };

  return useMutation({
    mutationFn: updateModeratorsFn,
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId)
      });
      toast({
        title: action === 'add' ? t('moderator-add-success.title') : t('moderator-remove-success.title'),
        description: action === 'add' ? t('moderator-add-success.description') : t('moderator-remove-success.description'),
      });
    },
    onError: (error, { action }) => {
      toast({
        title: action === 'add' ? t('moderator-add-fail.title') : t('moderator-remove-fail.title'),
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
