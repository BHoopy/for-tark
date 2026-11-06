import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { Fixture, tournamentBody, Match } from "@/types/types";
import { useTranslations } from "next-intl";
import { updateTournamentScore } from "@/lib/server-actions/scores";

interface Props {
  tournamentId: string;
  matchType?: "single_leg" | "two_leg";
}

interface UpdateRoundRobinScoreProps {
  fixture: Fixture;
  newScores: { score1: number; score2: number };
}

interface UpdateKnockoutScoreProps {
  match: Match;
  newScores: {
    score1_leg1: number;
    score2_leg1: number;
    score1_leg2: number | null;
    score2_leg2: number | null;
  };
}

export function useUpdateScore({ tournamentId, matchType }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const updateScoreFn = async (
    props: UpdateRoundRobinScoreProps | UpdateKnockoutScoreProps,
  ) => {
    await updateTournamentScore({
      tournamentId,
      matchType,
      update: props,
    });
  };

  return useMutation({
    mutationFn: updateScoreFn,
    onMutate: async (props) => {
      await queryClient.cancelQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
      const previousTournamentData = queryClient.getQueryData<tournamentBody>(
        tournamentsQueryKeys.tournament(tournamentId),
      );

      if ("fixture" in props) {
        queryClient.setQueryData<tournamentBody>(
          tournamentsQueryKeys.tournament(tournamentId),
          (oldData) => {
            if (!oldData) return oldData;

            const { fixture, newScores } = props;
            const updatedFixtures = (oldData.fixtures || []).map((f) =>
              f.round === fixture.round &&
              f.team1.name === fixture.team1.name &&
              f.team2?.name === fixture.team2?.name
                ? { ...f, score1: newScores.score1, score2: newScores.score2 }
                : f,
            );
            return { ...oldData, fixtures: updatedFixtures };
          },
        );
      }

      return { previousTournamentData };
    },
    onError: (err, variables, context) => {
      if (context?.previousTournamentData) {
        queryClient.setQueryData(
          tournamentsQueryKeys.tournament(tournamentId),
          context.previousTournamentData,
        );
      }
      console.error("Score update failed:", err);
      toast({
        title: t("score-update-fail.title"),
        description: t("score-update-fail.description"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: t("score-update-success.title"),
        description: t("score-update-success.description"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.tournament(tournamentId),
      });
    },
  });
}
