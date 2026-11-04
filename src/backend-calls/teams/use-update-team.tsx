
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useUpdateTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const updateTeamFn = async (team: teamBody) => {
    if (!tournamentId || !team.id)
      throw new Error("Tournament ID or Team ID is missing.");
    const teamDocRef = doc(db, "tournaments", tournamentId, "teams", team.id);

    const dataToUpdate: Partial<teamBody> = {
      name: team.name,
      roster: team.roster,
      logo: team.logo,
    };

    // Remove undefined fields
    Object.keys(dataToUpdate).forEach(
      (key) =>
        (dataToUpdate as any)[key] === undefined &&
        delete (dataToUpdate as any)[key],
    );

    return await updateDoc(teamDocRef, dataToUpdate);
  };

  return useMutation({
    mutationFn: updateTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("team-update-success.title"),
        description: t("team-update-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("team-update-fail.title"),
        description:
          (error as Error).message || t("team-update-fail.description"),
        variant: "destructive",
      });
    },
  });
}
