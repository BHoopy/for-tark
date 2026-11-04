
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsQueryKeys } from "@/backend-calls";
import { toast } from "@/hooks/use-toast";
import { teamBody, Match, Fixture, tournamentBody } from "@/types/types";
import { useTranslations } from "next-intl";
import {
  doc,
  updateDoc,
  getFirestore,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
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

  // For hybrid format, teams are already sorted (G1W, G1R, G2W, G2R, ...)
  // If teams are empty (pre-generation), it will create TBD matches.
  const participants = isGroupStageFollowup
    ? [...teams].sort(() => Math.random() - 0.5) // Shuffle qualified teams
    : [...teams].sort(() => Math.random() - 0.5);

  const numParticipants = isGroupStageFollowup
    ? teams.length > 0
      ? teams.length
      : numberOfTeams // For TBD generation, numberOfTeams is already the qualifier count
    : numberOfTeams;

  if (numParticipants < 2) return [];
  const totalRounds = Math.ceil(Math.log2(numParticipants));

  // Pad teams with "bye" placeholders if not a group stage followup and not a perfect power of 2
  const requiredByes =
    Math.pow(2, totalRounds) - numParticipants;
  if (!isGroupStageFollowup && requiredByes > 0) {
    for (let i = 0; i < requiredByes; i++) {
      participants.push({ id: "bye", name: "Bye", color: "transparent" });
    }
  }

  // --- Round 1 ---
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

  // --- Subsequent rounds ---
  let matchesInCurrentRound = round1MatchesCount;
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInNextRound = matchesInCurrentRound / 2;
    for (let i = 0; i < matchesInNextRound; i++) {
      matches.push({
        round: round,
        matchNumber: i + 1,
        team1Id: null, // To be filled by winner of previous round
        team2Id: null, // To be filled by winner of previous round
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

  // --- 3rd Place Match (Bronze Match) ---
  if (totalRounds > 1) {
    matches.push({
      round: totalRounds, // Occurs at the same time as the final
      matchNumber: 2, // Convention: final is match 1, bronze is match 2 of the final round
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
  const db = getFirestore(app);

  const generateFixturesFn = async ({ teams, regenerateKnockoutOnly = false }: GenerateFixturesProps) => {
    const batch = writeBatch(db);
    const tournamentRef = doc(db, "tournaments", tournamentId);

    // Clear existing matches if we are regenerating knockout
    if (regenerateKnockoutOnly) {
        const matchesCollectionRef = collection(db, 'tournaments', tournamentId, 'matches');
        // This is a simple way, but for large collections, a batched delete or a cloud function would be better.
        // For this app's scale, it should be fine.
        const existingMatches = await getDocs(matchesCollectionRef);
        existingMatches.forEach(doc => batch.delete(doc.ref));
    }


    if (
      format === "group_then_knockout" &&
      numberOfTeams === 48
    ) {
      if (!regenerateKnockoutOnly) {
        // Generate Group Stage for 48 teams
        const fixtures = generate48TeamGroupStage(teams, matchType);
        batch.update(tournamentRef, {
          fixtures: fixtures,
          matches: [], // Clear any old knockout matches
        });
      } else {
        // Regenerate Knockout Stage for 32 teams
        const matches = generate32TeamKnockout(teams, tournament);
         matches.forEach((match) => {
          const matchId = match.isBronzeMatch
            ? `r${match.round}_m_bronze`
            : `r${match.round}_m${match.matchNumber}`;
          const matchRef = doc(
            db,
            "tournaments",
            tournamentId,
            "matches",
            matchId,
          );
          batch.set(matchRef, match);
        });
      }
    } else if (format === "group_then_knockout") {
      // Logic for generating group stage fixtures
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
        batch.update(tournamentRef, {
          fixtures: allFixtures,
          matches: [], // Clear any old knockout matches
        });
      } else {
        // Logic for generating knockout stage from qualified teams or TBD
        const knockoutTeamsCount = (numberOfTeams ?? 0) / 2;
        const matches = generateKnockoutMatches(teams, knockoutTeamsCount, true);
        matches.forEach((match) => {
          const matchId = match.isBronzeMatch
            ? `r${match.round}_m_bronze`
            : `r${match.round}_m${match.matchNumber}`;
          const matchRef = doc(
            db,
            "tournaments",
            tournamentId,
            "matches",
            matchId,
          );
          batch.set(matchRef, match);
        });
      }
    } else if (format === "knockout") {
      if (!numberOfTeams || !teams)
        throw new Error("Number of teams not specified for knockout format.");

      const matches = generateKnockoutMatches(teams, numberOfTeams);
      matches.forEach((match) => {
        // Construct a unique ID
         const matchId = match.isBronzeMatch
            ? `r${match.round}_m_bronze`
            : `r${match.round}_m${match.matchNumber}`;
        const matchRef = doc(
          db,
          "tournaments",
          tournamentId,
          "matches",
          matchId,
        );
        batch.set(matchRef, match);
      });
    } else { // round-robin
      if (teams.length < 2) {
        throw new Error(
          "At least two teams are required to generate fixtures.",
        );
      }
      const fixtures = generateRoundRobinFixtures(teams, matchType);
      batch.update(tournamentRef, {
        fixtures,
      });
    }

    return await batch.commit();
  };

  return useMutation({
    mutationFn: generateFixturesFn,
    onSuccess: () => {
      toast({
        title: t("generate-fixtures-success.title"),
        description: t("generate-fixtures-success.description"),
      });
      // Invalidate both queries since we might be writing to either fixtures array or matches subcollection
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
