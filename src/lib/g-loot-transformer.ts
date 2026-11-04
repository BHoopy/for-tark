import { Match, teamBody, tournamentBody } from "@/types/types";

// This type is a placeholder for the structure required by the custom bracket
export interface CustomBracketRound {
  title: string;
  seeds: any[];
}


// This function transforms data for `react-brackets`
export const groupMatchesByRound = (
  originalMatches: Match[],
): Record<number, Match[]> => {
  if (!originalMatches || originalMatches.length === 0) {
    return {};
  }

  return originalMatches.reduce(
    (acc, match) => {
      const round = match.round;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, Match[]>,
  );
};

export const transformMatchesToBracketData = (
  matches: Match[],
  teams: teamBody[],
  tournament: tournamentBody,
): CustomBracketRound[] => {
  if (!matches || matches.length === 0) return [];

  const groupedRounds = groupMatchesByRound(matches);
  
  return Object.entries(groupedRounds)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([roundNumber, roundMatches]) => {
      const isFinal = Number(roundNumber) === Object.keys(groupedRounds).length;

      const seeds = roundMatches.map((match) => {
        const team1 = teams.find((t) => t.id === match.team1Id);
        const team2 = teams.find((t) => t.id === match.team2Id);
        
        const effectiveMatchType = isFinal || match.isBronzeMatch ? 'single_leg' : tournament.matchType;
        
        let score1, score2;
        if (effectiveMatchType === 'two_leg') {
            score1 = (match.score1_leg1 ?? 0) + (match.score1_leg2 ?? 0);
            score2 = (match.score2_leg1 ?? 0) + (match.score2_leg2 ?? 0);
        } else {
            score1 = match.score1_leg1;
            score2 = match.score2_leg1;
        }

        return {
          id: match.id,
          date: new Date().toDateString(),
          teams: [
            { name: team1?.name, logo: team1?.logo, score: score1 },
            { name: team2?.name, logo: team2?.logo, score: score2 },
          ],
          isBronzeMatch: match.isBronzeMatch,
        };
      });

      return {
        title: isFinal ? "Final" : `Round ${roundNumber}`,
        seeds,
      };
    });
};
