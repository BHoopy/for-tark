import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { Fixture, tournamentBody, Match } from "@/types/types";
import { useTranslations } from "next-intl";
import { getSql } from "@/lib/neon";

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
    const sql = getSql();

    // --- Knockout Score Update ---
    if ("match" in props) {
      const { match, newScores } = props;
      const tournamentRows = (await sql`
        SELECT number_of_teams, format
        FROM tournaments
        WHERE id = ${tournamentId}
        LIMIT 1
      `) as any[];
      const tournamentData = tournamentRows[0] ?? {};
      const is48TeamTournament = tournamentData.number_of_teams === 48;
      const totalRounds = is48TeamTournament
        ? 5
        : tournamentData.format === "group_then_knockout"
          ? Math.ceil(Math.log2((tournamentData.number_of_teams ?? 0) / 2))
          : Math.ceil(Math.log2(tournamentData.number_of_teams ?? 0));
      const isFinal = match.round === totalRounds;

      const effectiveMatchType =
        match.isBronzeMatch || isFinal ? "single_leg" : matchType;

      // 1. Update the current match
      await sql`
        UPDATE matches
        SET score1_leg1 = ${newScores.score1_leg1},
            score2_leg1 = ${newScores.score2_leg1},
            score1_leg2 = ${newScores.score1_leg2},
            score2_leg2 = ${newScores.score2_leg2},
            status = 'completed'
        WHERE id = ${match.id} AND tournament_id = ${tournamentId}
      `;

      // 2. Determine winner and loser
      let winnerId: string | null = null;
      let loserId: string | null = null;

      if (effectiveMatchType === "two_leg") {
        const aggScore1 =
          (newScores.score1_leg1 ?? 0) + (newScores.score1_leg2 ?? 0);
        const aggScore2 =
          (newScores.score2_leg1 ?? 0) + (newScores.score2_leg2 ?? 0);

        if (aggScore1 > aggScore2) {
          winnerId = match.team1Id;
          loserId = match.team2Id;
        } else if (aggScore2 > aggScore1) {
          winnerId = match.team2Id;
          loserId = match.team1Id;
        } else {
          const awayGoals1 = newScores.score1_leg2 ?? 0;
          const awayGoals2 = newScores.score2_leg1 ?? 0;
          if (awayGoals1 > awayGoals2) {
            winnerId = match.team1Id;
            loserId = match.team2Id;
          } else if (awayGoals2 > awayGoals1) {
            winnerId = match.team2Id;
            loserId = match.team1Id;
          } else {
            if ((match.team1Id ?? "") > (match.team2Id ?? "")) {
              winnerId = match.team1Id;
              loserId = match.team2Id;
            } else {
              winnerId = match.team2Id;
              loserId = match.team1Id;
            }
          }
        }
      } else {
        if ((newScores.score1_leg1 ?? 0) > (newScores.score2_leg1 ?? 0)) {
          winnerId = match.team1Id;
          loserId = match.team2Id;
        } else if ((newScores.score2_leg1 ?? 0) > (newScores.score1_leg1 ?? 0)) {
          winnerId = match.team2Id;
          loserId = match.team1Id;
        }
      }

      // 3. Advance winner to the next match
      if (winnerId && match.nextMatchId) {
        const isTeam1Slot = match.matchNumber % 2 !== 0;
        if (isTeam1Slot) {
          await sql`
            UPDATE matches
            SET team1_id = ${winnerId}
            WHERE id = ${match.nextMatchId} AND tournament_id = ${tournamentId}
          `;
        } else {
          await sql`
            UPDATE matches
            SET team2_id = ${winnerId}
            WHERE id = ${match.nextMatchId} AND tournament_id = ${tournamentId}
          `;
        }
      }

      // 4. Advance loser of semi-final to bronze match
      if (match.round === totalRounds - 1 && loserId) {
        const bronzeMatchId = `r${totalRounds}_m_bronze`;
        const isTeam1Slot = match.matchNumber === 1;
        if (isTeam1Slot) {
          await sql`
            UPDATE matches
            SET team1_id = ${loserId}
            WHERE id = ${bronzeMatchId} AND tournament_id = ${tournamentId}
          `;
        } else {
          await sql`
            UPDATE matches
            SET team2_id = ${loserId}
            WHERE id = ${bronzeMatchId} AND tournament_id = ${tournamentId}
          `;
        }
      }

      return;
    }

    // --- Round Robin Score Update ---
    const { fixture, newScores } = props;
    const tournamentRows = (await sql`
      SELECT fixtures
      FROM tournaments
      WHERE id = ${tournamentId}
      LIMIT 1
    `) as any[];

    if (!tournamentRows || tournamentRows.length === 0) {
      throw new Error("Tournament not found");
    }

    const tournamentData = tournamentRows[0] as tournamentBody;
    const fixtures = (tournamentData.fixtures as any) ?? [];

    const fixtureIndex = (fixtures as any[]).findIndex(
      (f: any) =>
        f.round === fixture.round &&
        f.team1?.name === fixture.team1?.name &&
        f.team2?.name === fixture.team2?.name,
    );

    if (fixtureIndex === -1) {
      throw new Error("Fixture not found");
    }

    const updatedFixtures = [...fixtures];
    updatedFixtures[fixtureIndex] = {
      ...updatedFixtures[fixtureIndex],
      score1: newScores.score1,
      score2: newScores.score2,
    };

    await sql`
      UPDATE tournaments
      SET fixtures = ${JSON.stringify(updatedFixtures)}, updated_at = now()
      WHERE id = ${tournamentId}
    `;
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