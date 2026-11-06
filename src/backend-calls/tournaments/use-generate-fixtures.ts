import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { teamBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { generateTournamentFixtures } from "@/lib/server-actions/fixtures";

interface GenerateFixturesProps {
  teams: teamBody[];
  regenerateKnockoutOnly?: boolean;
}

interface Props {
  tournamentId: string;
  format: "round_robin" | "knockout" | "group_then_knockout";
  matchType?: "single_leg" | "two_leg";
  numberOfTeams?: number;
}

export function useGenerateFixtures({
  tournamentId,
  format,
  matchType,
  numberOfTeams,
}: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const generateFixturesFn = async ({
    teams,
    regenerateKnockoutOnly = false,
  }: GenerateFixturesProps) => {
    await generateTournamentFixtures({
      tournamentId,
      format,
      matchType,
      numberOfTeams,
      teams,
      regenerateKnockoutOnly,
    });
  };

  return useMutation({
    mutationFn: generateFixturesFn,
    onSuccess: () => {
      toast({
        title: t("generate-fixtures-success.title"),
        description: t("generate-fixtures-success.description"),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
    },
    onError: (error) => {
      toast({
        title: t("generate-fixtures-fail.title"),
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
