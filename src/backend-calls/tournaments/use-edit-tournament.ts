
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { tournamentBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";

interface Props {
  id: string;
}

export function useEditTournament({ id }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const db = getFirestore(app);

  const editTournamentFn = async (
    updatedTournament: Partial<tournamentBody>,
  ) => {
    const tournamentRef = doc(db, "tournaments", id);
    const {
      name,
      description,
      rules,
      numberOfTeams,
      matchType,
      coverImageUrl,
    } = updatedTournament;

    const dataToUpdate: Partial<
      Omit<tournamentBody, "fixtures" | "teams" | "format">
    > = {
      name,
      description,
      rules,
      numberOfTeams,
      matchType,
      coverImageUrl,
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(dataToUpdate).forEach(
      (key) =>
        (dataToUpdate as any)[key] === undefined &&
        delete (dataToUpdate as any)[key],
    );

    return await updateDoc(tournamentRef, dataToUpdate);
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
