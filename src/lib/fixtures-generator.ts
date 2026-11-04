
import { teamBody, Fixture } from "@/types/types";

export function generateFixtures(
  teams: teamBody[],
  matchType: "single_leg" | "two_leg" = "single_leg",
) {
  const numberOfTeams = teams.length;
  let schedule = [...teams];
  const fixtures: Fixture[] = [];

  if (numberOfTeams % 2 !== 0) {
    schedule.push({ id: "bye", name: "bye", logo: "bye" });
  }

  const numRounds = schedule.length - 1;
  const halfNumTeams = schedule.length / 2;

  // Generate first leg
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < halfNumTeams; match++) {
      const team1 = schedule[match];
      const team2 = schedule[schedule.length - 1 - match];

      if (team1.name !== "bye" && team2.name !== "bye") {
        fixtures.push({
          round: round + 1,
          leg: 1,
          team1,
          team2,
        });
      } else if (team1.name !== "bye") {
        fixtures.push({
          round: round + 1,
          leg: 1,
          team1,
          team2: null,
        });
      } else if (team2.name !== "bye") {
        fixtures.push({
          round: round + 1,
          leg: 1,
          team1: team2,
          team2: null,
        });
      }
    }

    // Rotate teams for the next round
    const lastTeam = schedule.pop();
    if (lastTeam) {
      schedule.splice(1, 0, lastTeam);
    }
  }

  // Generate second leg if applicable
  if (matchType === "two_leg") {
    const firstLegFixtures = [...fixtures];
    firstLegFixtures.forEach((fixture) => {
      // Swap teams for the second leg
      if (fixture.team2) {
        fixtures.push({
          ...fixture,
          round: fixture.round + numRounds,
          leg: 2,
          team1: fixture.team2,
          team2: fixture.team1,
        });
      } else {
        // Handle bye
        fixtures.push({
          ...fixture,
          round: fixture.round + numRounds,
          leg: 2,
        });
      }
    });
  }

  return fixtures;
}

    