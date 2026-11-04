
import { teamBody, tournamentBody } from "@/types/types";
import { ChartConfig } from "@/components/charts/chart";

export type ChartProps = {
  tournament: tournamentBody;
  teams: teamBody[];
};

export function createChartData({ tournament, teams }: ChartProps) {
  return (teams ?? []).map((team) => {
    let totalPoints = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let played = 0;

    tournament.fixtures?.forEach((fixture) => {
      if (
        !fixture.team2 ||
        fixture.score1 === undefined ||
        fixture.score2 === undefined
      ) {
        return;
      }

      if (fixture.team1.id === team.id) {
        played++;
        goalsFor += fixture.score1;
        goalsAgainst += fixture.score2;
        if (fixture.score1 > fixture.score2) {
          totalPoints += 3;
          wins++;
        } else if (fixture.score1 === fixture.score2) {
          totalPoints += 1;
          draws++;
        } else {
          losses++;
        }
      } else if (fixture.team2.id === team.id) {
        played++;
        goalsFor += fixture.score2;
        goalsAgainst += fixture.score1;
        if (fixture.score2 > fixture.score1) {
          totalPoints += 3;
          wins++;
        } else if (fixture.score1 === fixture.score2) {
          totalPoints += 1;
          draws++;
        } else {
          losses++;
        }
      }
    });

    return {
      teamName: team.name,
      logo: team.logo,
      teamPoints: totalPoints,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      fill: team.color,
    };
  });
}

export function createChartConfig({ teams }: ChartProps) {
  return (teams ?? []).reduce((config, team) => {
    config[team.name.toLowerCase().replace(/\s+/g, "")] = {
      label: team.name,
      color: team.color,
    };
    return config;
  }, {} as ChartConfig);
}
