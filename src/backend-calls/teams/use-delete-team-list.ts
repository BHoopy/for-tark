
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, deleteDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { usersQueryKeys } from "../users";

interface DeleteTeamListProps {
  userId: string;
  listId: string;
}

export function useDeleteTeamList() {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const db = getFirestore(app);

  const deleteTeamListFn = async ({ userId, listId }: DeleteTeamListProps) => {
    if (!userId) throw new Error("User not authenticated.");
    const listDocRef = doc(db, "users", userId, "teamLists", listId);
    return await deleteDoc(listDocRef);
  };

  return useMutation({
    mutationFn: deleteTeamListFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.teamLists(variables.userId),
      });
      toast({
        title: "List deleted!",
        description: "The team list has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description:
          (error as Error).message || "Could not delete the team list.",
        variant: "destructive",
      });
    },
  });
}
