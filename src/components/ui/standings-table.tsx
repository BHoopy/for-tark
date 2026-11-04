
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teamBody, tournamentBody, Fixture } from "@/types/types";
import { createChartData as createStandingsData } from "@/components/charts/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { cn } from "@/lib/utils";

type StandingsTableProps = {
  tournament: tournamentBody;
  teams: teamBody[];
};

const GroupStandings = ({
  groupName,
  fixtures,
  teams,
  tournament,
}: {
  groupName: string;
  fixtures: Fixture[];
  teams: teamBody[];
  tournament: tournamentBody;
}) => {
  const t = useTranslations();
  const standingsData = createStandingsData({
    tournament: { ...tournament, fixtures }, // Pass the whole tournament object for context
    teams,
  }).sort(
    (a, b) =>
      b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference,
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          {t("tournament.standings.group")} {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StandingsTableLayout standingsData={standingsData} />
      </CardContent>
    </Card>
  );
};

const StandingsTableLayout = ({
  standingsData,
  isThirdPlaceTable,
}: {
  standingsData: ReturnType<typeof createStandingsData>;
  isThirdPlaceTable?: boolean;
}) => {
  const t = useTranslations();

  return (
    <div className="overflow-x-auto">
      <Table className="text-xs md:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 py-2 md:px-4 md:py-4">
              {t("tournament.standings.pos")}
            </TableHead>
            <TableHead className="min-w-[120px] px-2 py-2 md:min-w-[150px] md:px-4 md:py-4">
              {t("tournament.standings.team")}
            </TableHead>
            {isThirdPlaceTable && (
              <TableHead className="px-2 py-2 md:px-4 md:py-4">
                {t("tournament.standings.group")}
              </TableHead>
            )}
            <TableHead className="px-2 py-2 md:px-4 md:py-4">
              {t("tournament.standings.p")}
            </TableHead>
            <TableHead className="px-2 py-2 text-green-500 md:px-4 md:py-4">
              {t("tournament.standings.w")}
            </TableHead>
            <TableHead className="px-2 py-2 text-blue-500 md:px-4 md:py-4">
              {t("tournament.standings.d")}
            </TableHead>
            <TableHead className="px-2 py-2 text-red-500 md:px-4 md:py-4">
              {t("tournament.standings.l")}
            </TableHead>
            <TableHead className="px-2 py-2 md:px-4 md:py-4">
              {t("tournament.standings.gf")}
            </TableHead>
            <TableHead className="px-2 py-2 text-red-500 md:px-4 md:py-4">
              {t("tournament.standings.ga")}
            </TableHead>
            <TableHead className="px-2 py-2 md:px-4 md:py-4">
              {t("tournament.standings.gd")}
            </TableHead>
            <TableHead className="px-2 py-2 font-extrabold md:px-4 md:py-4">
              {t("tournament.standings.pts")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standingsData.map((team, index) => (
            <TableRow
              key={team.teamName}
              className={cn(
                !isThirdPlaceTable &&
                  index < 2 &&
                  "border-l-2 border-green-500 md:border-l-4",
                isThirdPlaceTable &&
                  index < 8 &&
                  "border-l-2 border-green-500 md:border-l-4",
              )}
            >
              <TableCell className="px-2 py-2 md:px-4 md:py-4">
                {index + 1}
              </TableCell>
              <TableCell className="px-2 py-2 font-medium md:px-4 md:py-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <Image
                    src={team.logo ?? "/Play.png"}
                    alt={team.teamName}
                    width={24}
                    height={24}
                    className="h-4 w-4 object-contain md:h-6 md:w-6"
                  />
                  <span className="truncate">{team.teamName}</span>
                </div>
              </TableCell>
              {isThirdPlaceTable && (
                <TableCell className="px-2 py-2 md:px-4 md:py-4">
                  {(team as any).group}
                </TableCell>
              )}
              <TableCell className="px-2 py-2 md:px-4 md:py-4">
                {team.played}
              </TableCell>
              <TableCell className="px-2 py-2 text-green-500 md:px-4 md:py-4">
                {team.wins}
              </TableCell>
              <TableCell className="px-2 py-2 text-blue-500 md:px-4 md:py-4">
                {team.draws}
              </TableCell>
              <TableCell className="px-2 py-2 text-red-500 md:px-4 md:py-4">
                {team.losses}
              </TableCell>
              <TableCell className="px-2 py-2 md:px-4 md:py-4">
                {team.goalsFor}
              </TableCell>
              <TableCell className="px-2 py-2 text-red-500 md:px-4 md:py-4">
                -{team.goalsAgainst}
              </TableCell>
              <TableCell className="px-2 py-2 md:px-4 md:py-4">
                {team.goalDifference}
              </TableCell>
              <TableCell className="px-2 py-2 font-extrabold md:px-4 md:py-4">
                {team.teamPoints}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function StandingsTable({ tournament, teams }: StandingsTableProps) {
  const t = useTranslations();
  if (tournament.format === "group_then_knockout") {
    const groups = (tournament.fixtures ?? []).reduce(
      (acc, fixture) => {
        const groupName = fixture.group ?? "default";
        if (!acc[groupName]) {
          acc[groupName] = { fixtures: [], teams: new Set<string>() };
        }
        acc[groupName].fixtures.push(fixture);
        if (fixture.team1?.id) acc[groupName].teams.add(fixture.team1.id);
        if (fixture.team2?.id) acc[groupName].teams.add(fixture.team2.id);
        return acc;
      },
      {} as Record<string, { fixtures: Fixture[]; teams: Set<string> }>,
    );

    const sortedGroupNames = Object.keys(groups).sort();

    let thirdPlaceTeams: any[] = [];
    if (tournament.numberOfTeams === 48) {
      Object.keys(groups).forEach((groupName) => {
        const groupTeams = teams.filter((t) =>
          groups[groupName].teams.has(t.id!),
        );
        const standings = createStandingsData({
          tournament: { ...tournament, fixtures: groups[groupName].fixtures },
          teams: groupTeams,
        }).sort(
          (a, b) =>
            b.teamPoints - a.teamPoints ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            b.wins - a.wins,
        );

        if (standings.length > 2) {
          thirdPlaceTeams.push({ ...standings[2], group: groupName });
        }
      });

      thirdPlaceTeams.sort(
        (a, b) =>
          b.teamPoints - a.teamPoints ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          b.wins - a.wins,
      );
    }

    return (
      <div>
        {sortedGroupNames.map((groupName) => {
          const groupTeams = teams.filter((t) =>
            groups[groupName].teams.has(t.id!),
          );
          return (
            <GroupStandings
              key={groupName}
              groupName={groupName}
              fixtures={groups[groupName].fixtures}
              teams={groupTeams}
              tournament={tournament}
            />
          );
        })}

        {tournament.numberOfTeams === 48 && thirdPlaceTeams.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t("tournament.third-place-ranking")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StandingsTableLayout
                standingsData={thirdPlaceTeams}
                isThirdPlaceTable={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const standingsData = createStandingsData({ tournament, teams }).sort(
    (a, b) =>
      b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference,
  );

  return <StandingsTableLayout standingsData={standingsData} />;
}
