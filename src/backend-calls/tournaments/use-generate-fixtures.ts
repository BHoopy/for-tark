import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { teamBody, Match, Fixture, tournamentBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { getSql } from "@/lib/neon";
import { generateFixtures as generateRoundRobinFixtures } from "@/lib/fixtures-generator";
import {
  generate48TeamGroupStage,
  generate32TeamKnockout,
} from "@/lib/world-cup-fixtures";

// --- New Knockout Generation Logic ---
function generateKnockoutMatches(
  teams: teamBody[],
  numberOfTeams: number,
  isGroupStageFollowup = false,
): Omit<Match, "id">[] {
  const matches: Omit<Match, "id">[] = [];

  const participants = isGroupStageFollowup
    ? [...teams].sort(() => Math.random() - 0.5)
    : [...teams].sort(() => Math.random() - 0.5);

  const numParticipants = isGroupStageFollowup
    ? teams.length > 0
      ? teams.length
      : numberOfTeams
    : numberOfTeams;

  if (numParticipants < 2) return [];
  const totalRounds = Math.ceil(Math.log2(numParticipants));

  const requiredByes =
    Math.pow(2, totalRounds) - numParticipants;
  if (!isGroupStageFollowup && requiredByes > 0) {
    for (let i = 0; i < requiredByes; i++) {
      participants.push({ id: "bye", name: "Bye", color: "transparent" });
    }
  }

  const round1MatchesCount = Math.pow(2, totalRounds) / 2;
  for (let i = 0; i < round1MatchesCount; i++) {
    const team1 = participants[i * 2];
    const team2 = participants[i * 2 + 1];

    matches.push({
      round: 1,
      matchNumber: i + 1,
      team1Id: team1?.id ?? null,
      team2Id: team2?.id ?? null,
      score1_leg1: null,
      score2_leg1: null,
      score1_leg2: null,
      score2_leg2: null,
      status: "pending",
      nextMatchId: `r2_m${Math.floor(i / 2) + 1}`,
    });
  }

  let matchesInCurrentRound = round1MatchesCount;
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInNextRound = matchesInCurrentRound / 2;
    for (let i = 0; i < matchesInNextRound; i++) {
      matches.push({
        round: round,
        matchNumber: i + 1,
        team1Id: null,
        team2Id: null,
        score1_leg1: null,
        score2_leg1: null,
        score1_leg2: null,
        score2_leg2: null,
        status: "pending",
        nextMatchId:
          round === totalRounds
            ? null
            : `r${round + 1}_m${Math.floor(i / 2) + 1}`,
      });
    }
    matchesInCurrentRound = matchesInNextRound;
  }

  if (totalRounds > 1) {
    matches.push({
      round: totalRounds,
      matchNumber: 2,
      team1Id: null,
      team2Id: null,
      score1_leg1: null,
      score2_leg1: null,
      score1_leg2: null,
      score2_leg2: null,
      status: "pending",
      nextMatchId: null,
      isBronzeMatch: true,
    });
  }

  return matches;
}
// --- End of New Knockout Generation Logic ---

interface GenerateFixturesProps {
  teams: teamBody[];
  regenerateKnockoutOnly?: boolean;
}

interface Props {
  tournamentId: string;
  format: "round_robin" | "knockout" | "group_then_knockout";
  matchType?: "single_leg" | "two_leg";
  numberOfTeams?: number;
  tournament: tournamentBody;
}

export function useGenerateFixtures({
  tournamentId,
  format,
  matchType,
  numberOfTeams,
  tournament,
}: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const generateFixturesFn = async ({ teams, regenerateKnockoutOnly = false }: GenerateFixturesProps) => {
    const sql = getSql();

    // Clear existing matches if we are regenerating knockout
    if (regenerateKnockoutOnly) {
      await sql`DELETE FROM matches WHERE tournament_id = ${tournamentId}`;
    }

    if (
      format === "group_then_knockout" &&
      numberOfTeams === 48
    ) {
      if (!regenerateKnockoutOnly) {
        const fixtures = generate48TeamGroupStage(teams, matchType);
        await sql`
          UPDATE tournaments
          SET fixtures = ${JSON.stringify(fixtures)}, updated_at = now()
          WHERE id = ${tournamentId}
        `;
        await sql`DELETE FROM matches WHERE tournament_id = ${tournamentId}`;
      } else {
        const matches = generate32TeamKnockout(teams, tournament);
        for (const match of matches) {
          const matchId = match.isBronzeMatch
            ? `r${match.round}_m_bronze`
            : `r${match.round}_m${match.matchNumber}`;
          await sql`
            INSERT INTO matches (id, tournament_id, round, match_number, team1_id, team2_id, score1_leg1, score2_leg1, score1_leg2, score2_leg2, status, next_match_id, is_bronze_match)
            VALUES (${matchId}, ${tournamentId}, ${match.round}, ${match.matchNumber}, ${match.team1Id}, ${match.team2Id}, ${match.score1_leg1}, ${match.score2_leg1}, ${match.score1_leg2}, ${match.score2_leg2}, ${match.status}, ${match.nextMatchId}, ${match.isBronzeMatch ?? false})
            ON CONFLICT (id) DO UPDATE SET
              tournament_id = EXCLUDED.tournament_id,
              round = EXCLUDED.round,
              match_number = EXCLUDED.match_number,
              team1_id = EXCLUDED.team1_id,
              team2_id = EXCLUDED.team2_id,
              score1_leg1 = EXCLUDED.score1_leg1,
              score2_leg1 = EXCLUDED.score2_leg1,
              score1_leg2 = EXCLUDED.score1_leg2,
              score2_leg2 = EXCLUDED.score2_leg2,
              status = EXCLUDED.status,
              next_match_id = EXCLUDED.next_match_id,
              is_bronze_match = EXCLUDED.is_bronze_match
          `;
        }
      }
    } else if (format === "group_then_knockout") {
      if (!regenerateKnockoutOnly) {
        if (teams.length < 8) {
          throw new Error(
            "At least 8 teams are required for a Group then Knockout format.",
          );
        }
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
        const groupSize = 4;
        const numGroups = Math.ceil(shuffledTeams.length / groupSize);
        let allFixtures: Fixture[] = [];

        for (let i = 0; i < numGroups; i++) {
          const groupTeams = shuffledTeams.slice(
            i * groupSize,
            (i + 1) * groupSize,
          );
          const groupFixtures = generateRoundRobinFixtures(
            groupTeams,
            matchType,
          );
          allFixtures = [
            ...allFixtures,
            ...groupFixtures.map((f) => ({
              ...f,
              group: String.fromCharCode(65 + i),
            })),
          ];
        }
        await sql`
          UPDATE tournaments
          SET fixtures = ${JSON.stringify(allFixtures)}, updated_at = now()
          WHERE id = ${tournamentId}
        `;
        await sql`DELETE FROM matches WHERE tournament_id = ${tournamentId}`;
      } else {
        const knockoutTeamsCount = (numberOfTeams ?? 0) / 2;
        const matches = generateKnockoutMatches(teams, knockoutTeamsCount, true);
        for (const match of matches) {
          const matchId = match.isBronzeMatch
            ? `r${match.round}_m_bronze`
            : `r${match.round}_m${match.matchNumber}`;
          await sql`
            INSERT INTO matches (id, tournament_id, round, match_number, team1_id, team2_id, score1_leg1, score2_leg1, score1_leg2, score2_leg2, status, next_match_id, is_bronze_match)
            VALUES (${matchId}, ${tournamentId}, ${match.round}, ${match.matchNumber}, ${match.team1Id}, ${match.team2Id}, ${match.score1_leg1}, ${match.score2_leg1}, ${match.score1_leg2}, ${match.score2_leg2}, ${match.status}, ${match.nextMatchId}, ${match.isBronzeMatch ?? false})
            ON CONFLICT (id) DO UPDATE SET
              tournament_id = EXCLUDED.tournament_id,
              round = EXCLUDED.round,
              match_number = EXCLUDED.match_number,
              team1_id = EXCLUDED.team1_id,
              team2_id = EXCLUDED.team2_id,
              score1_leg1 = EXCLUDED.score1_leg1,
              score2_leg1 = EXCLUDED.score2_leg1,
              score1_leg2 = EXCLUDED.score1_leg2,
              score2_leg2 = EXCLUDED.score2_leg2,
              status = EXCLUDED.status,
              next_match_id = EXCLUDED.next_match_id,
              is_bronze_match = EXCLUDED.is_bronze_match
          `;
        }
      }
    } else if (format === "knockout") {
      if (!numberOfTeams || !teams)
        throw new Error("Number of teams not specified for knockout format.");

      const matches = generateKnockoutMatches(teams, numberOfTeams);
      for (const match of matches) {
        const matchId = match.isBronzeMatch
          ? `r${match.round}_m_bronze`
          : `r${match.round}_m${match.matchNumber}`;
        await sql`
          INSERT INTO matches (id, tournament_id, round, match_number, team1_id, team2_id, score1_leg1, score2_leg1, score1_leg2, score2_leg2, status, next_match_id, is_bronze_match)
          VALUES (${matchId}, ${tournamentId}, ${match.round}, ${match.matchNumber}, ${match.team1Id}, ${match.team2Id}, ${match.score1_leg1}, ${match.score2_leg1}, ${match.score1_leg2}, ${match.score2_leg2}, ${match.status}, ${match.nextMatchId}, ${match.isBronzeMatch ?? false})
          ON CONFLICT (id) DO UPDATE SET
            tournament_id = EXCLUDED.tournament_id,
            round = EXCLUDED.round,
            match_number = EXCLUDED.match_number,
            team1_id = EXCLUDED.team1_id,
            team2_id = EXCLUDED.team2_id,
            score1_leg1 = EXCLUDED.score1_leg1,
            score2_leg1 = EXCLUDED.score2_leg1,
            score1_leg2 = EXCLUDED.score1_leg2,
            score2_leg2 = EXCLUDED.score2_leg2,
            status = EXCLUDED.status,
            next_match_id = EXCLUDED.next_match_id,
            is_bronze_match = EXCLUDED.is_bronze_match
        `;
      }
    } else {
      if (teams.length < 2) {
        throw new Error(
          "At least two teams are required to generate fixtures.",
        );
      }
      const fixtures = generateRoundRobinFixtures(teams, matchType);
      await sql`
        UPDATE tournaments
        SET fixtures = ${JSON.stringify(fixtures)}, updated_at = now()
        WHERE id = ${tournamentId}
      `;
    }

    return;
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