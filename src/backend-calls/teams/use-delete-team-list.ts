import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
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

  const deleteTeamListFn = async ({ userId, listId }: DeleteTeamListProps) => {
    if (!userId) throw new Error("User not authenticated.");
    const sql = getSql();
    await sql`
      DELETE FROM team_lists
      WHERE id = ${listId}
    `;
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