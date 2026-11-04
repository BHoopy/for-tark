
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  writeBatch,
  collection,
  getFirestore,
  doc,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import { tournamentsQueryKeys } from "../tournaments";

interface Props {
  tournamentId: string;
}

export function useAddMultipleTeams({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const addMultipleTeamsFn = async (teams: Omit<teamBody, "id">[]) => {
    if (!tournamentId) throw new Error("Tournament ID is missing.");

    const batch = writeBatch(db);
    const teamsCollectionRef = collection(
      db,
      "tournaments",
      tournamentId,
      "teams",
    );

    teams.forEach((team) => {
      const newTeamRef = doc(teamsCollectionRef);
      const teamData = {
        name: team.name,
        logo: team.logo || "/Play.png",
        roster: [],
      };
      batch.set(newTeamRef, teamData);
    });

    return await batch.commit();
  };

  return useMutation({
    mutationFn: addMultipleTeamsFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      toast({
        title: t("load-team-list-success.title"),
        description: t("load-team-list-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("load-team-list-fail.title"),
        description:
          (error as Error).message || t("load-team-list-fail.description"),
        variant: "destructive",
      });
    },
  });
}
