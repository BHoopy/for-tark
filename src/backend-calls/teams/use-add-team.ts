
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useAddTeam({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const addTeamFn = async (team: Omit<teamBody, "id">) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");
    const teamsCollectionRef = collection(
      db,
      "tournaments",
      tournamentId,
      "teams",
    );
    const teamData = {
      name: team.name,
      logo: team.logo || "/Play.png", // Ensure logo is passed and has a fallback
      roster: [],
    };
    return await addDoc(teamsCollectionRef, teamData);
  };

  return useMutation({
    mutationFn: addTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("toast.team-add-success.title"),
        description: t("toast.team-add-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.team-add-fail.title"),
        description:
          (error as Error).message || t("toast.team-add-fail.description"),
        variant: "destructive",
      });
    },
  });
}
