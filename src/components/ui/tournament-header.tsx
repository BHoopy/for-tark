
"use client";
import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/navbar/user-nav";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditTournamentForm } from "@/components/forms/edit-tournament-form";
import { Fixture, Match, teamBody, tournamentBody } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Loader2, RefreshCw, Share } from "lucide-react";
import { groupMatchesByRound } from "@/lib/g-loot-transformer";
import { toDataURL } from "@/lib/toDataURL";

type TournamentHeaderProps = {
  tournament: tournamentBody;
  teams: teamBody[];
  matches: Match[];
  activeTab: string;
  onTabChange: (value: string) => void;
  canManage: boolean;
  isPublic?: boolean;
  selectedStage: string;
  onStageChange: (value: string) => void;
  selectedRound: string;
  onRoundChange: (value: string) => void;
  isRoundFlipped: boolean;
  onRoundFlip: (value: boolean) => void;
};

export function TournamentHeader({
  tournament,
  teams,
  matches,
  activeTab,
  onTabChange,
  canManage,
  isPublic = false,
  selectedStage,
  onStageChange,
  selectedRound,
  onRoundChange,
  isRoundFlipped,
  onRoundFlip,
}: TournamentHeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [openEdit, setOpenEdit] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const getRoundTitle = (
    round: number,
    totalRounds: number,
    t: (key: string, values?: any) => string,
  ) => {
     if (tournament.numberOfTeams === 48) {
      if (round === 5) return t("tournament.final");
      if (round === 4) return t("tournament.semi-finals");
      if (round === 3) return t("tournament.quarter-finals");
      if (round === 2) return t("tournament.round-of", { count: 16 });
      if (round === 1) return t("tournament.round-of", { count: 32 });
    }
    if (totalRounds <= 1) return t("tournament.final");
    if (round === totalRounds) return t("tournament.final");
    if (round === totalRounds - 1) return t("tournament.semi-finals");
    if (round === totalRounds - 2) return t("tournament.quarter-finals");
    return t("tournament.round-of", {
      count: 2 ** (totalRounds - round + 1),
    });
  };

  const getRoundRobinRoundTitle = (
    roundNumber: number,
    numFirstLegRounds: number,
  ) => {
    if (tournament.matchType === "two_leg") {
      const leg = roundNumber > numFirstLegRounds ? 2 : 1;
      const roundInLeg =
        leg === 1 ? roundNumber : roundNumber - numFirstLegRounds;
      return `${t("forms.score.leg")} ${leg} - ${t(
        "tournament.round",
      )} ${roundInLeg}`;
    }
    return `${t("tournament.round")} ${roundNumber}`;
  };

  const stageOptions = [
    { value: "group_stage", label: t("forms.tournament.group_stage") },
    { value: "knockout", label: t("forms.tournament.knockout") },
  ];

  const roundRobinRounds = (tournament.fixtures ?? []).reduce(
    (acc, fixture) => {
      (acc[fixture.round] = acc[fixture.round] || []).push(fixture);
      return acc;
    },
    {} as { [key: number]: Fixture[] },
  );

  const roundRobinRoundNumbers = Object.keys(roundRobinRounds)
    .map(Number)
    .sort((a, b) => a - b);

  const numTeamsForRR = teams.length + (teams.length % 2);
  const numFirstLegRounds = numTeamsForRR > 1 ? numTeamsForRR - 1 : 0;

  const knockoutRounds = React.useMemo(
    () => groupMatchesByRound(matches),
    [matches],
  );
  const knockoutRoundNumbers = Object.keys(knockoutRounds)
    .map(Number)
    .sort((a, b) => a - b);
  const totalKnockoutRounds = knockoutRoundNumbers.length;

  const roundOptions =
    selectedStage === "knockout"
      ? knockoutRoundNumbers
      : roundRobinRoundNumbers;

  // Reset round selection when stage changes
  React.useEffect(() => {
    onRoundChange("1");
  }, [selectedStage, onRoundChange]);

  const handleShare = async () => {
    if (activeTab !== "fixtures") return;
    setIsExporting(true);

    const fixturesForRound =
      selectedStage === "knockout"
        ? knockoutRounds[Number(selectedRound)] ?? []
        : roundRobinRounds[Number(selectedRound)] ?? [];

    if (fixturesForRound.length === 0) {
      setIsExporting(false);
      return;
    }

    const canvas = document.createElement("canvas");
    const rowHeight = 150;
    const headerHeight = 120;
    const canvasWidth = 1800; // Increased width
    canvas.width = canvasWidth;
    canvas.height = headerHeight + fixturesForRound.length * rowHeight + 50;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Pre-load all logos
    const allTeamIds = new Set<string>();
    fixturesForRound.forEach((f: any) => {
      if (f.team1Id) allTeamIds.add(f.team1Id);
      if (f.team2Id) allTeamIds.add(f.team2Id);
      if (f.team1?.id) allTeamIds.add(f.team1.id);
      if (f.team2?.id) allTeamIds.add(f.team2.id);
    });

    const teamDataMap = new Map<string, teamBody>();
    teams.forEach((t) => teamDataMap.set(t.id!, t));

    const tournamentLogoUrl =
      tournament.coverImageUrl || "/favicon/android-chrome-512x512.png";
    const tournamentLogoData = await toDataURL(tournamentLogoUrl);
    const tournamentLogo = document.createElement("img");
    const tournamentLogoPromise = new Promise<void>((resolve) => {
      tournamentLogo.onload = () => resolve();
    });
    tournamentLogo.src = tournamentLogoData;

    const teamLogoPromises = Array.from(allTeamIds).map(async (teamId) => {
      const team = teamDataMap.get(teamId);
      if (team?.logo) {
        try {
          const dataUrl = await toDataURL(team.logo);
          return { teamId, dataUrl };
        } catch (e) {
          console.error(`Could not load logo for ${team.name}`, e);
          return { teamId, dataUrl: null };
        }
      }
      return { teamId, dataUrl: null };
    });

    const logoResults = await Promise.all([
      tournamentLogoPromise,
      ...teamLogoPromises,
    ]);
    const teamLogoDataUrls = logoResults.slice(1) as {
      teamId: string;
      dataUrl: string | null;
    }[];

    const teamLogoMap = new Map<string, HTMLImageElement>();
    const imageLoadPromises = teamLogoDataUrls
      .filter((r) => r.dataUrl)
      .map((result) => {
        const img = document.createElement("img");
        const imgPromise = new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        img.src = result.dataUrl!;
        teamLogoMap.set(result.teamId, img);
        return imgPromise;
      });

    await Promise.all(imageLoadPromises);

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Background
    ctx.fillStyle = "#002366";
    ctx.fillRect(0, 0, canvas.width, 100);

    // Centered Tournament Logo and Name
    const logoHeight = 80;
    const logoWidth = (tournamentLogo.width / tournamentLogo.height) * logoHeight;
    ctx.font = "bold 40px sans-serif";
    const textMetrics = ctx.measureText(tournament.name);
    const totalHeaderWidth = logoWidth + 20 + textMetrics.width;
    const headerStartX = (canvas.width - totalHeaderWidth) / 2;
    
    ctx.drawImage(tournamentLogo, headerStartX, 10, logoWidth, logoHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(
      tournament.name,
      headerStartX + logoWidth + 20,
      65,
    );

    // Round Title
    const roundTitle =
      selectedStage === "knockout"
        ? getRoundTitle(Number(selectedRound), totalKnockoutRounds, t)
        : getRoundRobinRoundTitle(Number(selectedRound), numFirstLegRounds);

    ctx.fillStyle = "#000000";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(roundTitle, canvas.width / 2, 130);

    // Draw fixtures
    fixturesForRound.forEach((fixture: any, index) => {
      const y = headerHeight + index * rowHeight;

      if (index % 2 !== 0) {
        ctx.fillStyle = "#f0f8ff"; // AliceBlue for zebra striping
        ctx.fillRect(0, y, canvasWidth, rowHeight);
      }
      
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(canvasWidth - 50, y);
      ctx.stroke();

      const team1 =
        selectedStage === "knockout"
          ? teamDataMap.get(fixture.team1Id)
          : fixture.team1;
      const team2 =
        selectedStage === "knockout"
          ? teamDataMap.get(fixture.team2Id)
          : fixture.team2;
      const logo1 = team1?.id ? teamLogoMap.get(team1.id) : undefined;
      const logo2 = team2?.id ? teamLogoMap.get(team2.id) : undefined;
      
      const team1X = 200;
      const team2X = canvasWidth - 200;

      // Team 1
      if (logo1) ctx.drawImage(logo1, team1X - 50, y + 25, 100, 100);
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#000000";
      ctx.fillText(team1?.name || "TBD", team1X + 60, y + 80);

      // Team 2
      if (logo2) ctx.drawImage(logo2, team2X - 50, y + 25, 100, 100);
      ctx.textAlign = "right";
      ctx.fillText(team2?.name || "TBD", team2X - 60, y + 80);

      // Scores
      let score1, score2;
      if (selectedStage === "knockout") {
        const aggScore1 =
          (fixture.score1_leg1 ?? 0) + (fixture.score1_leg2 ?? 0);
        const aggScore2 =
          (fixture.score2_leg1 ?? 0) + (fixture.score2_leg2 ?? 0);
        score1 =
          fixture.status === "completed"
            ? tournament.matchType === "two_leg"
              ? aggScore1
              : fixture.score1_leg1
            : "-";
        score2 =
          fixture.status === "completed"
            ? tournament.matchType === "two_leg"
              ? aggScore2
              : fixture.score2_leg1
            : "-";
      } else {
        score1 = fixture.score1 ?? "-";
        score2 = fixture.score2 ?? "-";
      }

      ctx.font = "bold 60px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${score1} : ${score2}`, canvas.width / 2, y + 90);

      if (fixture.group) {
        ctx.fillStyle = "#000000";
        ctx.font = "italic 16px sans-serif";
        ctx.fillText(
          `${t("tournament.standings.group")} ${fixture.group}`,
          canvas.width / 2,
          y + 120,
        );
      }
    });

    // Footer
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Generated by PlayChamp",
      canvas.width / 2,
      canvas.height - 20,
    );

    // Force download
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsExporting(false);
        return;
      }
      const fileName = `${tournament.name} - ${roundTitle}.png`;
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
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <UserNav
        title={tournament.name}
        isBack={!isPublic}
        backPath={isPublic ? `/${locale}/` : `/${locale}/user/tournaments`}
        avatar={isPublic}
      >
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/${locale}/user/tournament/${tournament.id}/teams`,
                )
              }
            >
              {t("tournament.tabs.teams")}
            </Button>
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("tournament.edit")}</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("tournament.edit")}</DialogTitle>
                </DialogHeader>
                <EditTournamentForm
                  data={tournament}
                  setOpenEdit={setOpenEdit}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </UserNav>

      <div className="container px-0 pt-2 md:px-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            {t("tournament.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="teams">{t("tournament.tabs.teams")}</TabsTrigger>
          <TabsTrigger value="fixtures">
            {t("tournament.tabs.fixtures")}
          </TabsTrigger>
          <TabsTrigger value="standings">
            {t("tournament.tabs.standings")}
          </TabsTrigger>
        </TabsList>
      </div>

      {activeTab === "fixtures" && (
        <div className="bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
          <div className="container flex items-center justify-center space-x-2 rounded-lg bg-muted p-1">
            <Select
              value={selectedStage}
              onValueChange={onStageChange}
              disabled={tournament.format !== "group_then_knockout"}
            >
              <SelectTrigger className="w-auto flex-grow border-r border-border">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions
                  .filter(
                    (opt) =>
                      tournament.format === "group_then_knockout" ||
                      (tournament.format === "knockout" &&
                        opt.value === "knockout") ||
                      (tournament.format === "round_robin" &&
                        opt.value === "group_stage"),
                  )
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={selectedRound} onValueChange={onRoundChange}>
              <SelectTrigger className="w-auto flex-grow">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {roundOptions.map((roundNumber) => (
                  <SelectItem key={roundNumber} value={String(roundNumber)}>
                    {selectedStage === "knockout"
                      ? getRoundTitle(roundNumber, totalKnockoutRounds, t)
                      : getRoundRobinRoundTitle(roundNumber, numFirstLegRounds)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStage === "knockout" &&
              tournament.matchType === "two_leg" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRoundFlip(!isRoundFlipped)}
                  className="h-8 w-8"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
