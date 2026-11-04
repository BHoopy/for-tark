
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { usersQueryKeys } from "../users";

interface SaveTeamListProps {
  userId: string;
  listName: string;
  teams: { name: string; logo: string }[];
}

export function useSaveTeamList() {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const saveTeamListFn = async ({
    userId,
    listName,
    teams,
  }: SaveTeamListProps) => {
    if (!userId) throw new Error("User not authenticated.");

    const teamListsCollectionRef = collection(db, "users", userId, "teamLists");
    const listData = {
      name: listName,
      teams: teams,
      createdAt: serverTimestamp(),
    };
    return await addDoc(teamListsCollectionRef, listData);
  };

  return useMutation({
    mutationFn: saveTeamListFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.teamLists(variables.userId),
      });
      toast({
        title: t("save-team-list-success.title"),
        description: t("save-team-list-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("save-team-list-fail.title"),
        description:
          (error as Error).message || t("save-team-list-fail.description"),
        variant: "destructive",
      });
    },
  });
}
