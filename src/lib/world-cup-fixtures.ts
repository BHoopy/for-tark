
import { Fixture, Match, teamBody, tournamentBody } from '@/types/types';
import { generateFixtures as generateRoundRobinFixtures } from '@/lib/fixtures-generator';
import { createChartData } from '@/components/charts/utils';

// Generate group stage for 48 teams (12 groups of 4)
export function generate48TeamGroupStage(
  teams: teamBody[],
  matchType?: 'single_leg' | 'two_leg',
): Fixture[] {
  if (teams.length !== 48) {
    throw new Error('This function requires exactly 48 teams.');
  }

  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  const groupSize = 4;
  const numGroups = 12;
  let allFixtures: Fixture[] = [];

  for (let i = 0; i < numGroups; i++) {
    const groupTeams = shuffledTeams.slice(
      i * groupSize,
      (i + 1) * groupSize,
    );
    const groupFixtures = generateRoundRobinFixtures(groupTeams, matchType);
    allFixtures = [
      ...allFixtures,
      ...groupFixtures.map((f) => ({
        ...f,
        group: String.fromCharCode(65 + i), // Groups A, B, C, ... L
      })),
    ];
  }
  return allFixtures;
}

// Generate knockout stage for 32 teams from a 48-team group stage
export function generate32TeamKnockout(
  teams: teamBody[],
  tournament: tournamentBody,
): Omit<Match, 'id'>[] {
  const matches: Omit<Match, 'id'>[] = [];
  if (!tournament.fixtures || teams.length < 48) {
    throw new Error(
      'Cannot generate knockout stage without a complete 48-team group stage.',
    );
  }

  // 1. Group fixtures and teams
  const groups = tournament.fixtures.reduce(
    (acc, fixture) => {
      const groupName = fixture.group ?? 'default';
      if (!acc[groupName]) {
        acc[groupName] = { fixtures: [], teamIds: new Set<string>() };
      }
      acc[groupName].fixtures.push(fixture);
      if (fixture.team1?.id) acc[groupName].teamIds.add(fixture.team1.id);
      if (fixture.team2?.id) acc[groupName].teamIds.add(fixture.team2.id);
      return acc;
    },
    {} as Record<
      string,
      { fixtures: Fixture[]; teamIds: Set<string> }
    >,
  );

  const groupStandings: { group: string; standings: any[] }[] = [];
  const thirdPlaceTeams: any[] = [];

  // 2. Calculate standings for each group
  Object.keys(groups)
    .sort()
    .forEach((groupName) => {
      const groupTeams = teams.filter((t) =>
        groups[groupName].teamIds.has(t.id!),
      );
      const standings = createChartData({
        tournament: { ...tournament, fixtures: groups[groupName].fixtures },
        teams: groupTeams,
      }).sort( // Sort within the group to find 1st, 2nd, 3rd
        (a, b) =>
          b.teamPoints - a.teamPoints ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          b.wins - a.wins
      );

      groupStandings.push({ group: groupName, standings });
      if (standings[2]) {
        thirdPlaceTeams.push({ ...standings[2], group: groupName });
      }
    });

  // 3. Determine qualified teams
  const qualifiedTeams: teamBody[] = [];

  // Add top 2 from each group
  groupStandings.forEach(({ standings }) => {
    const winner = teams.find((t) => t.name === standings[0]?.teamName);
    const runnerUp = teams.find((t) => t.name === standings[1]?.teamName);
    if (winner) qualifiedTeams.push(winner);
    if (runnerUp) qualifiedTeams.push(runnerUp);
  });

  // Add 8 best third-place teams
  thirdPlaceTeams
    .sort(
      (a, b) =>
        b.teamPoints - a.teamPoints ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        b.wins - a.wins,
    )
    .slice(0, 8)
    .forEach((teamStanding) => {
      const team = teams.find((t) => t.name === teamStanding.teamName);
      if (team) qualifiedTeams.push(team);
    });
  
  if (qualifiedTeams.length !== 32) {
    // This case should ideally not happen if group stage is complete.
    // Handle error or generate a TBD bracket.
    console.error("Could not determine exactly 32 qualified teams.");
    return [];
  }

  // 4. Generate knockout matches for the 32 qualified teams
  const shuffledQualifiedTeams = qualifiedTeams.sort(() => Math.random() - 0.5);

  // Round of 32
  for (let i = 0; i < 16; i++) {
    const team1 = shuffledQualifiedTeams[i * 2];
    const team2 = shuffledQualifiedTeams[i * 2 + 1];
    matches.push({
      round: 1,
      matchNumber: i + 1,
      team1Id: team1?.id ?? null,
      team2Id: team2?.id ?? null,
      score1_leg1: null,
      score2_leg1: null,
      score1_leg2: null,
      score2_leg2: null,
      status: 'pending',
      nextMatchId: `r2_m${Math.floor(i / 2) + 1}`,
    });
  }

  // Subsequent rounds (Round of 16, QF, SF, Final)
  let matchesInCurrentRound = 16;
  // Rounds 2, 3, 4, 5
  for (let round = 2; round <= 5; round++) { 
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
        status: 'pending',
        nextMatchId:
          round === 5 ? null : `r${round + 1}_m${Math.floor(i / 2) + 1}`,
      });
    }
    matchesInCurrentRound = matchesInNextRound;
  }
  
    // --- 3rd Place Match (Bronze Match) for the final round ---
    matches.push({
      round: 5, // Occurs at the same time as the final
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


  return matches;
}
