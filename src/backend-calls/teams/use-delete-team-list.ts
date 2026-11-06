import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { usersQueryKeys } from "../users";
import { deleteTeamList } from "@/lib/server-actions/teams";

interface DeleteTeamListProps {
  userId: string;
  listId: string;
}

export function useDeleteTeamList() {
  const queryClient = useQueryClient();

  const deleteTeamListFn = async ({ userId, listId }: DeleteTeamListProps) => {
    if (!userId) throw new Error("User not authenticated.");
    await deleteTeamList(listId);
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
