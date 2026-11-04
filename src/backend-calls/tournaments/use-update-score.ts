
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { Fixture, tournamentBody, Match } from "@/types/types";
import { useTranslations } from "next-intl";
import {
  doc,
  getDoc,
  updateDoc,
  getFirestore,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";

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
  const db = getFirestore(app);

  const updateScoreFn = async (
    props: UpdateRoundRobinScoreProps | UpdateKnockoutScoreProps,
  ) => {
    // --- Knockout Score Update ---
    if ("match" in props) {
      const { match, newScores } = props;
      const tournamentDoc = await getDoc(
        doc(db, "tournaments", tournamentId),
      );
      const tournamentData = tournamentDoc.data() as tournamentBody;
      const is48TeamTournament = tournamentData.numberOfTeams === 48;
      const totalRounds = is48TeamTournament
        ? 5
        : tournamentData.format === "group_then_knockout"
          ? Math.ceil(Math.log2((tournamentData.numberOfTeams ?? 0) / 2))
          : Math.ceil(Math.log2(tournamentData.numberOfTeams ?? 0));
      const isFinal = match.round === totalRounds;

      const batch = writeBatch(db);
      const effectiveMatchType =
        match.isBronzeMatch || isFinal ? "single_leg" : matchType;

      // 1. Update the current match
      const currentMatchRef = doc(
        db,
        "tournaments",
        tournamentId,
        "matches",
        match.id,
      );
      batch.update(currentMatchRef, { ...newScores, status: "completed" });

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
          // Aggregate scores are equal, check away goals
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
        // single_leg logic
        if ((newScores.score1_leg1 ?? 0) > (newScores.score2_leg1 ?? 0)) {
          winnerId = match.team1Id;
          loserId = match.team2Id;
        } else if ((newScores.score2_leg1 ?? 0) > (newScores.score1_leg1 ?? 0)) {
          winnerId = match.team2Id;
          loserId = match.team1Id;
        } else {
          // Draw in a single leg knockout match
        }
      }

      // 3. Advance winner to the next match
      if (winnerId && match.nextMatchId) {
        const nextMatchRef = doc(
          db,
          "tournaments",
          tournamentId,
          "matches",
          match.nextMatchId,
        );
        const isTeam1Slot = match.matchNumber % 2 !== 0;
        if (isTeam1Slot) {
          batch.update(nextMatchRef, { team1Id: winnerId });
        } else {
          batch.update(nextMatchRef, { team2Id: winnerId });
        }
      }

      // 4. Advance loser of semi-final to bronze match
      if (match.round === totalRounds - 1 && loserId) {
        const bronzeMatchId = `r${totalRounds}_m_bronze`;
        const bronzeMatchRef = doc(
          db,
          "tournaments",
          tournamentId,
          "matches",
          bronzeMatchId,
        );
        const isTeam1Slot = match.matchNumber === 1; // SF1 loser
        if (isTeam1Slot) {
          batch.update(bronzeMatchRef, { team1Id: loserId });
        } else {
          batch.update(bronzeMatchRef, { team2Id: loserId });
        }
      }

      return await batch.commit();
    }

    // --- Round Robin Score Update ---
    const { fixture, newScores } = props;
    const tournamentRef = doc(db, "tournaments", tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) {
      throw new Error("Tournament not found");
    }

    const tournamentData = tournamentDoc.data() as tournamentBody;
    const fixtures = tournamentData.fixtures ?? [];

    const fixtureIndex = fixtures.findIndex(
      (f) =>
        f.round === fixture.round &&
        f.team1.name === fixture.team1.name &&
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

    return await updateDoc(tournamentRef, {
      fixtures: updatedFixtures,
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
