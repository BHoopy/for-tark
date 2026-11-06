"use client";
import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Fixture, teamBody, tournamentBody, Match } from "@/types/types";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UpdateScoreForm } from "@/components/forms/update-score-form";
import { Loader2, Pencil, Share } from "lucide-react";
import { useGenerateFixtures } from "@/backend-calls";
import KnockoutBracket from "./knockout-bracket";
import PulseLoader from "./pulse-loader";
import Image from "next/image";
import { createChartData } from "../charts/utils";
import { toDataURL } from "@/lib/toDataURL";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

type FixturesPreviewProps = {
  fixtures: Fixture[]; // For round-robin
  teams: teamBody[];
  canManage: boolean;
  tournamentId: string;
  tournament: tournamentBody;
  tournamentFormat: tournamentBody["format"];
  matchType?: "single_leg" | "two_leg";
  numberOfTeams?: number;
  matches: Match[];
  selectedStage: string;
  selectedRound: string;
  isRoundFlipped?: boolean;
};

const FixtureMatch = ({
  match,
  canUpdateScore,
  tournamentId,
  matchType,
  tournamentName,
  tournamentLogoUrl,
}: {
  match: Fixture;
  canUpdateScore: boolean;
  tournamentId: string;
  matchType?: "single_leg" | "two_leg";
  tournamentName: string;
  tournamentLogoUrl: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const t = useTranslations();

  const isClosed =
    match.score1 !== undefined &&
    match.score1 !== null &&
    match.score2 !== undefined &&
    match.score2 !== null;

  const TeamDisplay = ({
    team,
    score,
    isAway = false,
  }: {
    team: teamBody | null;
    score: number | undefined | null;
    isAway?: boolean;
  }) => {
    if (!team || team.name === "bye") {
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="font-semibold">{t("tournament.standings.bye")}</span>
        </div>
      );
    }
    const scoreElement = (
      <span className="text-3xl font-bold">{score ?? "-"}</span>
    );
    const teamElement = (
      <div className="flex flex-col items-center justify-center gap-2">
        <Image
          src={team.logo ?? "/Play.png"}
          alt={team.name}
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
        <span className="w-24 truncate text-center text-sm font-semibold">
          {team.name}
        </span>
      </div>
    );

    return (
      <div className="flex w-full items-center justify-center gap-4">
        {isAway && scoreElement}
        {teamElement}
        {!isAway && scoreElement}
      </div>
    );
  };

  const handleShare = async () => {
    if (!match.team1 || !match.team2) return;
    setIsExporting(true);

    const canvas = document.createElement("canvas");
    canvas.width = 1800; // Increased width
    canvas.height = 800; // Increased height for better quality
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const [tournamentLogoData, logo1Data, logo2Data] = await Promise.all([
      toDataURL(tournamentLogoUrl),
      toDataURL(match.team1.logo || "/Play.png"),
      toDataURL(match.team2.logo || "/Play.png"),
    ]);

    const tournamentLogo = document.createElement("img");
    const logo1 = document.createElement("img");
    const logo2 = document.createElement("img");

    const tournamentLogoPromise = new Promise<void>((resolve) => {
      tournamentLogo.onload = () => resolve();
    });
    const logo1Promise = new Promise<void>((resolve) => {
      logo1.onload = () => resolve();
    });
    const logo2Promise = new Promise<void>((resolve) => {
      logo2.onload = () => resolve();
    });
    tournamentLogo.src = tournamentLogoData;
    logo1.src = logo1Data;
    logo2.src = logo2Data;

    await Promise.all([tournamentLogoPromise, logo1Promise, logo2Promise]);

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Background
    ctx.fillStyle = "#002366";
    ctx.fillRect(0, 0, canvas.width, 150); // Taller header

    // Tournament Logo
    const logoHeight = 120; // Bigger logo
    const logoWidth =
      (tournamentLogo.width / tournamentLogo.height) * logoHeight;
    ctx.drawImage(tournamentLogo, 50, 15, logoWidth, logoHeight);

    // Tournament Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 60px sans-serif"; // Bigger font
    ctx.textAlign = "left";
    ctx.fillText(tournamentName, 50 + logoWidth + 30, 95);

    // Round Title
    const roundTitle = `${t("tournament.round")} ${match.round}`;
    ctx.font = "40px sans-serif"; // Bigger font
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(roundTitle, canvas.width / 2, 220); // Positioned lower

    // Team 1
    if (logo1) ctx.drawImage(logo1, 200, canvas.height / 2 - 100, 200, 200); // Bigger logo
    ctx.font = "bold 50px sans-serif"; // Bigger font
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.fillText(match.team1.name, 300, canvas.height / 2 + 150);

    // Team 2
    if (logo2)
      ctx.drawImage(
        logo2,
        canvas.width - 400,
        canvas.height / 2 - 100,
        200,
        200,
      );
    ctx.fillText(match.team2.name, canvas.width - 300, canvas.height / 2 + 150);

    // Scores
    ctx.font = "bold 100px sans-serif"; // Much bigger font
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(
      `${match.score1 ?? "-"} : ${match.score2 ?? "-"}`,
      canvas.width / 2,
      canvas.height / 2 + 40,
    );

    // Leg Info
    if (match.leg) {
      ctx.fillStyle = "#000000";
      ctx.font = "italic 30px sans-serif";
      ctx.fillText(
        `${t("forms.score.leg")} ${match.leg}`,
        canvas.width / 2,
        canvas.height / 2 + 90,
      );
    }

    // Group Info
    if (match.group) {
      ctx.fillStyle = "#000000";
      ctx.font = "italic 30px sans-serif";
      ctx.fillText(
        `${t("tournament.standings.group")} ${match.group}`,
        canvas.width / 2,
        canvas.height - 100,
      );
    }

    // Closed status
    if (isClosed) {
      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("CLOSED", canvas.width / 2, canvas.height - 50);
    }

    // Footer
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Generated by PlayChamp",
      canvas.width / 2,
      canvas.height - 20,
    );

    // Force download
    canvas.toBlob(async (blob) => {
      if (!blob || !match.team1 || !match.team2) {
        setIsExporting(false);
        return;
      }
      const fileName = `${tournamentName} - ${match.team1.name} vs ${match.team2.name}.png`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setIsExporting(false);
    }, "image/png");
  };

  return (
    <Card className="relative w-full max-w-sm p-4 pt-8 md:max-w-md">
      {isClosed && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
          CLOSED
        </span>
      )}
      {matchType === "two_leg" && match.leg && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground",
            isClosed ? "top-4" : "top-1",
          )}
        >
          {t("forms.score.leg")} {match.leg}
        </div>
      )}
      <CardContent className="relative flex items-center justify-center p-0">
        <div className="flex w-2/5 items-center justify-end">
          <TeamDisplay team={match.team1} score={match.score1} />
        </div>

        <div className="flex w-1/5 flex-col items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground">:</span>
        </div>

        <div className="flex w-2/5 items-center justify-start">
          <TeamDisplay team={match.team2} score={match.score2} isAway={true} />
        </div>

        <div className="absolute -top-5 right-0 flex gap-2">
          {canUpdateScore && match.team2 && match.team2.name !== "bye" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto p-1.5 text-xs"
                >
                  {t("forms.score.set-scores")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("forms.score.update")}</DialogTitle>
                </DialogHeader>
                <UpdateScoreForm
                  fixture={match}
                  setOpen={setOpen}
                  tournamentId={tournamentId}
                  matchType={matchType}
                />
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-auto rounded-full p-1"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Share className="h-3 w-3" />
            )}
          </Button>
        </div>
        {match.group && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {t("tournament.standings.group")} {match.group}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function FixturesPreview({
  fixtures,
  teams,
  canManage,
  tournamentId,
  tournament,
  tournamentFormat,
  matchType,
  numberOfTeams,
  matches,
  selectedStage,
  selectedRound,
  isRoundFlipped,
}: FixturesPreviewProps) {
  const t = useTranslations();
  const { user } = useUser();

  const canUpdateScore = !!(
    canManage || tournament.moderators?.includes(user?.uid ?? "")
  );

  const generateFixturesMutation = useGenerateFixtures({
    tournamentId,
    format: tournamentFormat,
    numberOfTeams,
    matchType,
  });

  const [isLoadingMatches, setIsLoadingMatches] = React.useState(true);

  React.useEffect(() => {
    if (matches) setIsLoadingMatches(false);
  }, [matches]);

  const roundRobinRounds = (fixtures ?? []).reduce(
    (acc, fixture) => {
      (acc[fixture.round] = acc[fixture.round] || []).push(fixture);
      return acc;
    },
    {} as { [key: number]: Fixture[] },
  );

  const canGenerateKnockout =
    (tournamentFormat === "knockout" ||
      tournamentFormat === "group_then_knockout") &&
    numberOfTeams !== undefined &&
    teams.length > 0 &&
    teams.length <= numberOfTeams;

  const canGenerateRoundRobin =
    tournamentFormat === "round_robin" && teams.length >= 2;

  const canGenerateGroup =
    tournamentFormat === "group_then_knockout" &&
    teams.length >= 8 &&
    teams.length <= (numberOfTeams || 0);

  const hasFixtures =
    ((tournamentFormat === "knockout" ||
      tournamentFormat === "group_then_knockout") &&
      (matches.length > 0 || (fixtures && fixtures.length > 0))) ||
    (tournamentFormat === "round_robin" && fixtures && fixtures.length > 0);

  const isGroupStageComplete = React.useMemo(() => {
    if (
      tournamentFormat !== "group_then_knockout" ||
      !fixtures ||
      fixtures.length === 0
    ) {
      return false;
    }
    return fixtures.every(
      (f) =>
        f.team2 === null ||
        (f.score1 !== undefined &&
          f.score1 !== null &&
          f.score2 !== undefined &&
          f.score2 !== null),
    );
  }, [fixtures, tournamentFormat]);

  const handleGenerateKnockout = () => {
    let qualifiedTeams: teamBody[] = [];

    if (
      tournament.format === "group_then_knockout" &&
      tournament.numberOfTeams === 48
    ) {
      generateFixturesMutation.mutate({ teams, regenerateKnockoutOnly: true });
      return;
    }

    if (isGroupStageComplete) {
      const groups = (fixtures ?? []).reduce(
        (acc, fixture) => {
          const groupName = fixture.group ?? "default";
          if (!acc[groupName]) {
            acc[groupName] = { fixtures: [], teams: new Set<string>() };
          }
          acc[groupName].fixtures.push(fixture);
          if (fixture.team1) acc[groupName].teams.add(fixture.team1.id!);
          if (fixture.team2) acc[groupName].teams.add(fixture.team2.id!);
          return acc;
        },
        {} as Record<string, { fixtures: Fixture[]; teams: Set<string> }>,
      );

      Object.keys(groups)
        .sort()
        .forEach((groupName) => {
          const groupTeams = teams.filter((t) =>
            groups[groupName].teams.has(t.id!),
          );
          const standings = createChartData({
            tournament: { ...tournament, fixtures: groups[groupName].fixtures },
            teams: groupTeams,
          }).sort(
            (a, b) =>
              b.teamPoints - a.teamPoints ||
              b.goalDifference - a.goalDifference,
          );

          const winner = teams.find((t) => t.name === standings[0]?.teamName);
          const runnerUp = teams.find((t) => t.name === standings[1]?.teamName);

          if (winner) qualifiedTeams.push(winner);
          if (runnerUp) qualifiedTeams.push(runnerUp);
        });
    }
    generateFixturesMutation.mutate({
      teams: qualifiedTeams,
      regenerateKnockoutOnly: true,
    });
  };

  const handleRegenerate = () => {
    if (
      tournamentFormat === "group_then_knockout" &&
      selectedStage === "knockout"
    ) {
      handleGenerateKnockout();
    } else {
      generateFixturesMutation.mutate({ teams });
    }
  };

  const renderContent = () => {
    if (isLoadingMatches) return <PulseLoader />;

    if (canManage && !hasFixtures) {
      const canGenerate =
        (tournamentFormat === "round_robin" && canGenerateRoundRobin) ||
        (tournamentFormat === "knockout" && canGenerateKnockout) ||
        (tournamentFormat === "group_then_knockout" && canGenerateGroup);

      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
            <p>{t("no.fixtures")}</p>
            <Button
              onClick={() => generateFixturesMutation.mutate({ teams })}
              disabled={generateFixturesMutation.isPending || !canGenerate}
            >
              {generateFixturesMutation.isPending
                ? t("tournament.generating-fixtures")
                : t("tournament.generate-fixtures")}
            </Button>
            {tournamentFormat === "knockout" && !canGenerateKnockout && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {t("forms.tournament.knockout-generation-notice")}
              </p>
            )}
            {tournamentFormat === "knockout" &&
              numberOfTeams !== undefined &&
              teams.length > numberOfTeams && (
                <p className="text-sm text-destructive">
                  {t("forms.tournament.knockout-team-mismatch-too-many", {
                    teamCount: teams.length,
                    totalTeams: numberOfTeams,
                  })}
                </p>
              )}
            {tournamentFormat === "knockout" &&
              numberOfTeams !== undefined &&
              teams.length < numberOfTeams && (
                <p className="text-sm text-muted-foreground">
                  {t("forms.tournament.knockout-team-mismatch", {
                    teamCount: teams.length,
                    totalTeams: numberOfTeams,
                  })}
                </p>
              )}
            {tournamentFormat === "round_robin" && teams.length < 2 && (
              <p className="text-sm text-muted-foreground">
                {t("tournament.add-more-teams")}
              </p>
            )}
            {tournamentFormat === "group_then_knockout" &&
              !canGenerateGroup && (
                <p className="text-sm text-muted-foreground">
                  {t("forms.tournament.group-generation-notice", {
                    required: 8,
                    count: teams.length,
                  })}
                </p>
              )}
          </CardContent>
        </Card>
      );
    }

    if (selectedStage === "knockout" && matches.length === 0) {
      const canGenerate48TeamKnockout =
        tournament.format === "group_then_knockout" &&
        tournament.numberOfTeams === 48 &&
        isGroupStageComplete;

      if (canManage) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
              <p>{t("no.knockout-fixtures")}</p>
              <Button
                onClick={handleGenerateKnockout}
                disabled={
                  generateFixturesMutation.isPending ||
                  (!isGroupStageComplete && !canGenerate48TeamKnockout)
                }
              >
                {generateFixturesMutation.isPending
                  ? t("tournament.generating-fixtures")
                  : t("tournament.generate-knockout")}
              </Button>
              {!isGroupStageComplete && (
                <p className="text-sm text-muted-foreground">
                  {t("no.group-stage-complete")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      }
      return <p>{t("no.knockout-fixtures-yet")}</p>;
    }

    if (!hasFixtures) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p>{t("no.fixtures")}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mt-6">
        {selectedStage === "knockout" ? (
          <KnockoutBracket
            matches={matches}
            teams={teams}
            canUpdateScore={canUpdateScore}
            tournamentId={tournamentId}
            numberOfTeams={numberOfTeams ?? 0}
            selectedRound={parseInt(selectedRound, 10)}
            matchType={matchType}
            tournamentName={tournament.name}
            tournamentLogoUrl={
              tournament.coverImageUrl || "/favicon/android-chrome-512x512.png"
            }
            isRoundFlipped={isRoundFlipped}
          />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {roundRobinRounds[parseInt(selectedRound, 10)]?.map(
              (match, matchIndex) => (
                <FixtureMatch
                  key={`${selectedRound}-${matchIndex}`}
                  match={match}
                  canUpdateScore={canUpdateScore}
                  tournamentId={tournamentId}
                  matchType={matchType}
                  tournamentName={tournament.name}
                  tournamentLogoUrl={
                    tournament.coverImageUrl ||
                    "/favicon/android-chrome-512x512.png"
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    );
  };

  const canGenerate =
    (tournamentFormat === "round_robin" && canGenerateRoundRobin) ||
    (tournamentFormat === "knockout" && canGenerateKnockout) ||
    (tournamentFormat === "group_then_knockout" &&
      (canGenerateGroup || selectedStage === "knockout"));

  return (
    <div className="w-full">
      {renderContent()}

      {canManage && hasFixtures && (
        <div className="mt-8 flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={generateFixturesMutation.isPending || !canGenerate}
              >
                {t("tournament.regenerate-fixtures")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("forms.tournament.regenerate-title")}
                </DialogTitle>
                <DialogDescription>
                  {t("forms.tournament.regenerate-description")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">
                    {t("forms.tournament.cancel")}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={handleRegenerate}
                    disabled={generateFixturesMutation.isPending}
                  >
                    {generateFixturesMutation.isPending
                      ? t("tournament.generating-fixtures")
                      : t("forms.tournament.continue")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
