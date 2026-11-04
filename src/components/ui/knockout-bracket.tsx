
"use client";

import React from "react";
import { Match, teamBody } from "@/types/types";
import { useTranslations } from "next-intl";
import { groupMatchesByRound } from "@/lib/g-loot-transformer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Share, Trophy } from "lucide-react";
import { UpdateScoreForm } from "../forms/update-score-form";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toDataURL } from "@/lib/toDataURL";

interface KnockoutBracketProps {
  matches: Match[];
  teams: teamBody[];
  canUpdateScore: boolean;
  tournamentId: string;
  numberOfTeams: number;
  selectedRound?: number;
  matchType?: "single_leg" | "two_leg";
  tournamentName: string;
  tournamentLogoUrl: string;
  isRoundFlipped?: boolean;
}

const MatchComponent = ({
  match,
  teams,
  canUpdateScore,
  tournamentId,
  matchType,
  isFinal,
  isBronze,
  tournamentName,
  tournamentLogoUrl,
  isFlipped,
}: {
  match: Match;
  teams: teamBody[];
  canUpdateScore: boolean;
  tournamentId: string;
  matchType?: "single_leg" | "two_leg";
  isFinal: boolean;
  isBronze: boolean;
  tournamentName: string;
  tournamentLogoUrl: string;
  isFlipped: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const t = useTranslations();

  const team1 = teams.find((t) => t.id === match.team1Id);
  const team2 = teams.find((t) => t.id === match.team2Id);

  const isClosed = match.status === "completed";

  const aggScore1 = (match.score1_leg1 ?? 0) + (match.score1_leg2 ?? 0);
  const aggScore2 = (match.score2_leg1 ?? 0) + (match.score2_leg2 ?? 0);

  const effectiveMatchType = isFinal || isBronze ? "single_leg" : matchType;

  const getWinner = () => {
    if (!isClosed || !team1 || !team2) return null;

    if (effectiveMatchType === "two_leg") {
      const aggScore1 =
        (match.score1_leg1 ?? 0) + (match.score1_leg2 ?? 0);
      const aggScore2 =
        (match.score2_leg1 ?? 0) + (match.score2_leg2 ?? 0);

      if (aggScore1 > aggScore2) return team1;
      if (aggScore2 > aggScore1) return team2;

      const awayGoals1 = match.score1_leg2 ?? 0;
      const awayGoals2 = match.score2_leg1 ?? 0;
      if (awayGoals1 > awayGoals2) return team1;
      if (awayGoals2 > awayGoals1) return team2;

      return (match.score1_leg2 ?? 0) > (match.score2_leg2 ?? 0)
        ? team1
        : team2;
    }

    // single_leg logic
    if ((match.score1_leg1 ?? 0) > (match.score2_leg1 ?? 0)) {
      return team1;
    }
    if ((match.score2_leg1 ?? 0) > (match.score1_leg1 ?? 0)) {
      return team2;
    }

    return null;
  };

  const winner = getWinner();

  const TeamDisplay = ({
    team,
    score,
    isAway = false,
  }: {
    team: teamBody | undefined;
    score: number | null;
    isAway?: boolean;
  }) => {
    const scoreElement = (
      <span className="w-8 text-center text-3xl font-bold">
        {score ?? "-"}
      </span>
    );
    const teamElement = (
      <div className="flex flex-col items-center justify-center gap-2">
        <Image
          src={team?.logo ?? "/Play.png"}
          alt={team?.name || "TBD"}
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
        <span className="w-24 truncate text-center text-sm font-semibold">
          {team?.name || "TBD"}
        </span>
      </div>
    );

    return (
      <div className="flex w-full items-center justify-center gap-4">
        {isAway ? (
          <>
            {scoreElement}
            {teamElement}
          </>
        ) : (
          <>
            {teamElement}
            {scoreElement}
          </>
        )}
      </div>
    );
  };

  const MatchFace = ({ leg }: { leg: 1 | 2 }) => {
    const isSecondLeg = leg === 2;
    const homeTeam = isSecondLeg ? team2 : team1;
    const awayTeam = isSecondLeg ? team1 : team2;
    const homeScore = isSecondLeg ? match.score2_leg2 : match.score1_leg1;
    const awayScore = isSecondLeg ? match.score1_leg2 : match.score2_leg1;

    return (
      <div
        className={cn(
          "absolute flex h-full w-full items-center justify-center p-4 backface-hidden",
          isSecondLeg && "rotate-y-180",
        )}
      >
        <div className="flex w-full items-center">
          <div className="flex w-2/5 items-center justify-end">
            <TeamDisplay
              team={homeTeam}
              score={homeScore ?? null}
              isAway={false}
            />
          </div>

          <div className="flex w-1/5 flex-col items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">:</span>
          </div>

          <div className="flex w-2/5 items-center justify-start">
            <TeamDisplay
              team={awayTeam}
              score={awayScore ?? null}
              isAway={true}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleShare = async () => {
    if (!team1 || !team2) return;
    setIsExporting(true);

    const canvas = document.createElement("canvas");
    canvas.width = 1400; // Increased width
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const [tournamentLogoData, logo1Data, logo2Data] = await Promise.all([
      toDataURL(tournamentLogoUrl),
      toDataURL(team1.logo || "/Play.png"),
      toDataURL(team2.logo || "/Play.png"),
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
    ctx.fillRect(0, 0, canvas.width, 120);

    // Tournament Logo
    const logoHeight = 80;
    const logoWidth =
      (tournamentLogo.width / tournamentLogo.height) * logoHeight;
    ctx.drawImage(tournamentLogo, 40, 20, logoWidth, logoHeight);

    // Tournament Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(tournamentName, 40 + logoWidth + 20, 80);

    // Round Title
    const totalRounds = Math.ceil(Math.log2(teams.length || 2));
    let roundTitle = getRoundTitle(match.round, totalRounds, t);
    if (isFinal) {
      roundTitle = t("tournament.final");
    } else if (isBronze) {
      roundTitle = t("tournament.third-place-match");
    }
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(roundTitle, canvas.width / 2, 160);

    const team1X = 250;
    const team2X = canvas.width - 250;

    // Team 1
    if (logo1)
      ctx.drawImage(logo1, team1X - 75, canvas.height / 2 - 75, 150, 150);
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.fillText(team1.name, team1X, canvas.height / 2 + 120);

    // Team 2
    if (logo2)
      ctx.drawImage(logo2, team2X - 75, canvas.height / 2 - 75, 150, 150);
    ctx.fillText(team2.name, team2X, canvas.height / 2 + 120);

    // Scores
    const scoreText =
      effectiveMatchType === "two_leg"
        ? `${aggScore1} : ${aggScore2}`
        : `${match.score1_leg1 ?? "-"} : ${match.score2_leg1 ?? "-"}`;

    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scoreText, canvas.width / 2, canvas.height / 2 + 30);

    // Crown Champion
    if (isFinal && winner) {
      ctx.fillStyle = "#FFD700"; // Gold
      ctx.font = "bold 32px sans-serif";
      const winnerX = winner.id === team1.id ? team1X : team2X;
      ctx.fillText(
        `🏆 ${t("tournament.champion")} 🏆`,
        winnerX,
        canvas.height / 2 - 100,
      );
    }

    // Closed status
    if (isClosed) {
      ctx.fillStyle = "#16a34a"; // Green color for closed
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("CLOSED", canvas.width / 2, canvas.height - 40);
    }
    // Footer
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Generated by PlayChamp",
      canvas.width / 2,
      canvas.height - 15,
    );

    // Force download
    canvas.toBlob(async (blob) => {
      if (!blob || !team1 || !team2) {
        setIsExporting(false);
        return;
      }
      const fileName = `${tournamentName} - ${team1.name} vs ${team2.name}.png`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      setIsExporting(false);
    }, "image/png");
  };

  return (
    <div className="relative">
      <Card
        className={cn(
          "relative w-96 p-4 pt-8",
          isBronze && "border-amber-700/60",
        )}
      >
        {isClosed && (
          <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
            CLOSED
          </span>
        )}

        {canUpdateScore && team1 && team2 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-1 top-1 h-auto p-1.5 text-xs"
              >
                {t("forms.score.set-scores")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("forms.score.update")}</DialogTitle>
              </DialogHeader>
              <UpdateScoreForm
                match={{ ...match, team1, team2 }}
                setOpen={setOpen}
                tournamentId={tournamentId}
                matchType={effectiveMatchType}
                isFinal={isFinal}
              />
            </DialogContent>
          </Dialog>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="absolute bottom-1 right-1 h-auto rounded-full p-1"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Share className="h-3 w-3" />
          )}
        </Button>

        <CardContent className="relative h-28 w-full p-0 perspective-1000">
          {effectiveMatchType === "two_leg" ? (
            <>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
                {isFlipped ? t("forms.score.leg2") : t("forms.score.leg1")}
              </div>
              <div
                className={cn(
                  "relative h-full w-full transition-transform duration-700 transform-style-preserve-3d",
                  isFlipped && "rotate-y-180",
                )}
              >
                <MatchFace leg={1} />
                <MatchFace leg={2} />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex w-2/5 items-center justify-end">
                <TeamDisplay
                  team={team1}
                  score={match.score1_leg1 ?? null}
                  isAway={false}
                />
              </div>
              <div className="flex w-1/5 flex-col items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground">
                  :
                </span>
              </div>
              <div className="flex w-2/5 items-center justify-start">
                <TeamDisplay
                  team={team2}
                  score={match.score2_leg1 ?? null}
                  isAway={true}
                />
              </div>
            </div>
          )}
        </CardContent>

        {effectiveMatchType === "two_leg" && isClosed && (
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            <span>
              {t("forms.score.agg")}{" "}
              {isFlipped
                ? `${aggScore2} - ${aggScore1}`
                : `${aggScore1} - ${aggScore2}`}
            </span>
          </div>
        )}
      </Card>
      {winner && (isFinal || isBronze) && (
        <Card
          className={cn(
            "mt-8",
            isFinal && "bg-gradient-to-tr from-primary/20 to-transparent",
            isBronze && "bg-gradient-to-tr from-amber-700/20 to-transparent",
          )}
        >
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
            <h4
              className={cn(
                "flex items-center gap-2 text-xl font-bold tracking-wider",
                isFinal && "text-amber-400",
                isBronze && "text-amber-700",
              )}
            >
              <Trophy className="h-6 w-6" />
              {isFinal ? t("tournament.champion") : t("tournament.third-place")}
            </h4>
            <Image
              src={winner.logo ?? "/Play.png"}
              alt={winner.name}
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
            <p className="text-2xl font-extrabold">{winner.name}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const RoundComponent = ({
  matches,
  teams,
  canUpdateScore,
  tournamentId,
  matchType,
  isFinal,
  tournamentName,
  tournamentLogoUrl,
  isRoundFlipped,
}: {
  matches: Match[];
  teams: teamBody[];
  canUpdateScore: boolean;
  tournamentId: string;
  matchType?: "single_leg" | "two_leg";
  isFinal: boolean;
  tournamentName: string;
  tournamentLogoUrl: string;
  isRoundFlipped: boolean;
}) => {
  return (
    <div className="flex flex-col justify-around">
      <div className="flex flex-col justify-around gap-16">
        {matches.map((match) => (
          <div key={match.id} className="relative">
            <MatchComponent
              match={match}
              teams={teams}
              canUpdateScore={canUpdateScore}
              tournamentId={tournamentId}
              matchType={matchType}
              isFinal={isFinal && !match.isBronzeMatch}
              isBronze={!!match.isBronzeMatch}
              tournamentName={tournamentName}
              tournamentLogoUrl={tournamentLogoUrl}
              isFlipped={isRoundFlipped}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const getRoundTitle = (
  round: number,
  totalRounds: number,
  t: (key: string, values?: any) => string,
) => {
  if (totalRounds <= 1) return t("tournament.final");
  if (round === totalRounds) return t("tournament.final");
  if (round === totalRounds - 1) return t("tournament.semi-finals");
  if (round === totalRounds - 2) return t("tournament.quarter-finals");
  return t("tournament.round-of", {
    count: 2 ** (totalRounds - round + 1),
  });
};

export default function KnockoutBracket({
  matches,
  teams,
  canUpdateScore,
  tournamentId,
  selectedRound,
  matchType,
  tournamentName,
  tournamentLogoUrl,
  isRoundFlipped = false,
}: KnockoutBracketProps) {
  const t = useTranslations();

  const rounds = React.useMemo(() => groupMatchesByRound(matches), [matches]);
  const roundKeys = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  const totalRounds = roundKeys.length;

  if (roundKeys.length === 0) {
    return <div>{t("no.fixtures")}</div>;
  }

  const roundsToDisplay = selectedRound
    ? roundKeys.filter((key) => key === selectedRound)
    : roundKeys;

  return (
    <div className="p-2">
      {/* scale wrapper */}
      <div className="origin-top scale-[0.7] sm:scale-[0.85] md:scale-100">
        <div className="flex justify-center space-x-12 md:space-x-24">
          {roundsToDisplay.map((key) => {
            const finalRoundMatches = rounds[key].filter(
              (m) => !m.isBronzeMatch,
            );
            const bronzeMatch = rounds[key].find((m) => m.isBronzeMatch);

            return (
              <div
                key={key}
                className="flex flex-col items-center gap-8 md:gap-16"
              >
                <RoundComponent
                  matches={finalRoundMatches}
                  teams={teams}
                  canUpdateScore={canUpdateScore}
                  tournamentId={tournamentId}
                  matchType={matchType}
                  isFinal={key === totalRounds}
                  tournamentName={tournamentName}
                  tournamentLogoUrl={tournamentLogoUrl}
                  isRoundFlipped={isRoundFlipped}
                />
                {bronzeMatch && (
                  <div className="mt-8 md:mt-16">
                    <h3 className="mb-4 text-center text-xl font-bold">
                      {t("tournament.third-place-match")}
                    </h3>
                    <RoundComponent
                      matches={[bronzeMatch]}
                      teams={teams}
                      canUpdateScore={canUpdateScore}
                      tournamentId={tournamentId}
                      matchType={matchType}
                      isFinal={false} // it's not the final
                      tournamentName={tournamentName}
                      tournamentLogoUrl={tournamentLogoUrl}
                      isRoundFlipped={isRoundFlipped}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

