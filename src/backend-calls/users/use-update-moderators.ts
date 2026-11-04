import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
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

  const updateModeratorsFn = async ({ userId, action }: UpdateModeratorsParams) => {
    const sql = getSql();

    if (action === "add") {
      await sql`
        UPDATE tournaments
        SET moderators = CASE
          WHEN ${userId} = ANY(COALESCE(moderators, '{}'))
            THEN moderators
          ELSE array_append(COALESCE(moderators, '{}'), ${userId})
        END,
            updated_at = NOW()
        WHERE id = ${tournamentId}
      `;
    } else {
      await sql`
        UPDATE tournaments
        SET moderators = array_remove(COALESCE(moderators, '{}'), ${userId}),
            updated_at = NOW()
        WHERE id = ${tournamentId}
      `;
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
