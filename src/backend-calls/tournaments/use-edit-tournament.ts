import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { tournamentBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { getSql } from "@/lib/neon";

interface Props {
  id: string;
}

export function useEditTournament({ id }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const editTournamentFn = async (
    updatedTournament: Partial<tournamentBody>,
  ) => {
    const sql = getSql();
    const {
      name,
      description,
      rules,
      numberOfTeams,
      matchType,
      coverImageUrl,
    } = updatedTournament;

    const hasName = name !== undefined;
    const hasDescription = description !== undefined;
    const hasRules = rules !== undefined;
    const hasNumberOfTeams = numberOfTeams !== undefined;
    const hasMatchType = matchType !== undefined;
    const hasCoverImageUrl = coverImageUrl !== undefined;

    await sql`
      UPDATE tournaments
      SET
        name = CASE WHEN ${hasName} THEN ${name ?? null} ELSE name END,
        description = CASE WHEN ${hasDescription} THEN ${description ?? null} ELSE description END,
        rules = CASE WHEN ${hasRules} THEN ${rules ?? null} ELSE rules END,
        number_of_teams = CASE WHEN ${hasNumberOfTeams} THEN ${numberOfTeams ?? null} ELSE number_of_teams END,
        match_type = CASE WHEN ${hasMatchType} THEN ${matchType ?? null} ELSE match_type END,
        cover_image_url = CASE WHEN ${hasCoverImageUrl} THEN ${coverImageUrl ?? null} ELSE cover_image_url END,
        updated_at = NOW()
      WHERE id = ${id}
    `;
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