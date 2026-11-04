import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
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

  const saveTeamListFn = async ({
    userId,
    listName,
    teams,
  }: SaveTeamListProps) => {
    if (!userId) throw new Error("User not authenticated.");

    const sql = getSql();
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO team_lists (id, name, teams)
      VALUES (${id}, ${listName}, ${JSON.stringify(teams)}::jsonb)
    `;
    return { id };
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