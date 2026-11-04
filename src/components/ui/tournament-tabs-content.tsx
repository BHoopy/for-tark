
"use client";
import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Loader2, Share } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StandingsTable } from "@/components/ui/standings-table";
import FixturesPreview from "@/components/ui/fixtures-preview";
import WinnerCard from "@/components/ui/winner-card";
import { CommentSection } from "@/components/ui/comment-section";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import PulseLoader from "@/components/ui/pulse-loader";

import { createChartData } from "@/components/charts/utils";
import {
  tournamentBody,
  teamBody,
  Match,
  UserProfile,
  Fixture,
} from "@/types/types";
import {
  useAddMultipleTeams,
  useFetchTeamLists,
  useSaveTeamList,
  useUpdateFavorites,
  useUserById,
} from "@/backend-calls";
import { useUser } from "@/hooks/use-user";
import { toDataURL } from "@/lib/toDataURL";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTournamentPlaceholder } from "@/lib/tournament-placeholders";

const saveTeamListSchema = z.object({
  listName: z.string().min(1, "List name is required"),
});

// New component to render text with clickable links
const LinkifiedText = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
};

type TournamentTabsContentProps = {
  activeTab: string;
  tournament: tournamentBody;
  teams: teamBody[];
  matches: Match[];
  organizer?: UserProfile | null;
  canManage: boolean;
  selectedStage: string;
  selectedRound: string;
  isRoundFlipped?: boolean;
};

export function TournamentTabsContent({
  activeTab,
  tournament,
  teams,
  matches,
  organizer,
  canManage,
  selectedStage,
  selectedRound,
  isRoundFlipped,
}: TournamentTabsContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useUser();

  const [saveListDialogOpen, setSaveListDialogOpen] = useState(false);
  const [loadListDialogOpen, setLoadListDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: userProfile } = useUserById(user?.uid ?? "");
  const { mutate: updateFavorites } = useUpdateFavorites({
    userId: user?.uid ?? "",
  });

  const isFavorited = useMemo(
    () => userProfile?.favoriteTournaments?.includes(tournament.id!) ?? false,
    [userProfile, tournament.id],
  );

  const saveTeamListMutation = useSaveTeamList();
  const addMultipleTeamsMutation = useAddMultipleTeams({
    tournamentId: tournament.id!,
  });
  const { data: savedTeamLists, isLoading: isLoadingTeamLists } =
    useFetchTeamLists(user?.uid);

  const saveTeamListForm = useForm({
    resolver: zodResolver(saveTeamListSchema),
    defaultValues: { listName: "" },
  });

  const onSaveTeamList = (values: z.infer<typeof saveTeamListSchema>) => {
    if (!user) return;
    const teamData = teams.map(({ name, logo }) => ({ name, logo: logo! }));
    saveTeamListMutation.mutate(
      { userId: user.uid, listName: values.listName, teams: teamData },
      {
        onSuccess: () => {
          saveTeamListForm.reset();
          setSaveListDialogOpen(false);
        },
      },
    );
  };

  const handleToggleFavorite = () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    updateFavorites({
      tournamentId: tournament.id!,
      action: isFavorited ? "remove" : "add",
    });
  };

  const handleLoadList = (teamList: any) => {
    addMultipleTeamsMutation.mutate(teamList.teams, {
      onSuccess: () => {
        setLoadListDialogOpen(false);
      },
    });
  };

  const handleShareTournament = () => {
    const url = `${window.location.origin}/${locale}/show/${tournament.id}`;
    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: "URL Copied!",
          description: "The tournament link has been copied to your clipboard.",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the URL. Please try again.",
          variant: "destructive",
        });
        console.error("Could not copy text: ", err);
      },
    );
  };

  const isTournamentComplete = React.useMemo(() => {
    if (!tournament) return false;
    if (
      tournament.format === "knockout" ||
      tournament.format === "group_then_knockout"
    ) {
      const totalRounds =
        tournament.numberOfTeams === 48
          ? 5
          : tournament.format === "group_then_knockout"
            ? Math.ceil(Math.log2((tournament.numberOfTeams ?? 2) / 2))
            : Math.ceil(Math.log2(tournament.numberOfTeams ?? 2));
      const finalMatch = matches.find(
        (m) => m.round === totalRounds && !m.isBronzeMatch,
      );
      return finalMatch?.status === "completed";
    }
    // Round Robin
    if (!tournament.fixtures || tournament.fixtures.length === 0) return false;
    return tournament.fixtures.every(
      (fixture) =>
        fixture.team2 === null ||
        (fixture.score1 !== undefined &&
          fixture.score1 !== null &&
          fixture.score2 !== undefined &&
          fixture.score2 !== null),
    );
  }, [tournament, matches]);

  const winner = React.useMemo(() => {
    if (!isTournamentComplete || !tournament || teams.length === 0)
      return null;

    if (
      tournament.format === "knockout" ||
      tournament.format === "group_then_knockout"
    ) {
      const totalRounds =
        tournament.numberOfTeams === 48
          ? 5
          : tournament.format === "group_then_knockout"
            ? Math.ceil(Math.log2((tournament.numberOfTeams ?? 2) / 2))
            : Math.ceil(Math.log2(tournament.numberOfTeams ?? 2));
      const finalMatch = matches.find(
        (m) => m.round === totalRounds && !m.isBronzeMatch,
      );
      if (!finalMatch || finalMatch.status !== "completed") return null;

      const score1 = finalMatch.score1_leg1 ?? 0;
      const score2 = finalMatch.score2_leg1 ?? 0;

      const winnerId =
        score1 > score2 ? finalMatch.team1Id : finalMatch.team2Id;
      return teams.find((team) => team.id === winnerId) ?? null;
    }

    // Round Robin
    const standingsData = createChartData({ tournament, teams }).sort(
      (a, b) =>
        b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference,
    );
    if (standingsData.length === 0) return null;
    const winnerName = standingsData[0]?.teamName;
    return teams.find((team) => team.name === winnerName) ?? null;
  }, [isTournamentComplete, tournament, teams, matches]);

  const legendTerms = [
    {
      term: t("tournament.standings.p"),
      definition: t("tournament.standings_definitions.played"),
    },
    {
      term: t("tournament.standings.w"),
      definition: t("tournament.standings_definitions.wins"),
      color: "text-green-500",
    },
    {
      term: t("tournament.standings.d"),
      definition: t("tournament.standings_definitions.draws"),
      color: "text-blue-500",
    },
    {
      term: t("tournament.standings.l"),
      definition: t("tournament.standings_definitions.losses"),
      color: "text-red-500",
    },
    {
      term: t("tournament.standings.gf"),
      definition: t("tournament.standings_definitions.goals_for"),
    },
    {
      term: t("tournament.standings.ga"),
      definition: t("tournament.standings_definitions.goals_against"),
      color: "text-red-500",
    },
    {
      term: t("tournament.standings.gd"),
      definition: t("tournament.standings_definitions.goal_difference"),
    },
    {
      term: t("tournament.standings.pts"),
      definition: t("tournament.standings_definitions.points"),
    },
  ];

  const exportStandingsAsImage = async () => {
    setIsExporting(true);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const rowHeight = 60;
    const tableHeaderHeight = 40;
    const groupHeaderHeight = 60;
    const headerHeight = 150;
    const legendHeight = 120;
    const canvasWidth = 1200;
    canvas.width = canvasWidth;

    const foregroundColor = "#000000";
    const winColor = "#16a34a";
    const drawColor = "#2563eb";
    const lossColor = "#dc2626";

    const tournamentLogoUrl =
      tournament.coverImageUrl || "/favicon/android-chrome-512x512.png";
    const tournamentLogoData = await toDataURL(tournamentLogoUrl);
    const tournamentLogo = document.createElement("img");
    const tournamentLogoPromise = new Promise<void>((resolve) => {
      tournamentLogo.onload = () => resolve();
    });
    tournamentLogo.src = tournamentLogoData;
    await tournamentLogoPromise;

    const drawMainHeader = () => {
      ctx.fillStyle = "#002366";
      ctx.fillRect(0, 0, canvasWidth, 120);
      const logoHeight = 80;
      const logoWidth = (tournamentLogo.width / tournamentLogo.height) * logoHeight;
      
      ctx.font = "bold 48px sans-serif";
      const textMetrics = ctx.measureText(tournament.name);
      const totalHeaderWidth = logoWidth + 20 + textMetrics.width;
      const headerStartX = (canvasWidth - totalHeaderWidth) / 2;

      ctx.drawImage(tournamentLogo, headerStartX, 20, logoWidth, logoHeight);

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(tournament.name, headerStartX + logoWidth + 20, 80);

      ctx.font = "28px sans-serif";
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "center";
      ctx.fillText("Standings", canvasWidth / 2, headerHeight - 10);
    };

    const drawTableHeader = (y: number, isThirdPlace = false) => {
      const headers = isThirdPlace
        ? ["Pos", "Team", "Group", "P", "W", "D", "L", "GF", "GA", "GD", "PTS"]
        : ["Pos", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "PTS"];
      const colWidths = isThirdPlace
        ? [60, 340, 80, 60, 60, 60, 60, 60, 60, 60, 80]
        : [80, 400, 60, 60, 60, 60, 60, 60, 60, 80];
      let x_header = 40;
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = foregroundColor;
      headers.forEach((header, i) => {
        ctx.textAlign = i === 1 ? "left" : "center";
        const textX = i === 1 ? x_header + 60 : x_header + colWidths[i] / 2;
        ctx.fillText(header, textX, y);
        x_header += colWidths[i];
      });
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, y + 20);
      ctx.lineTo(canvasWidth - 40, y + 20);
      ctx.stroke();
    };

    const drawTableRows = async (standings: any[], startY: number, isThirdPlace = false) => {
      const colWidths = isThirdPlace
        ? [60, 340, 80, 60, 60, 60, 60, 60, 60, 60, 80]
        : [80, 400, 60, 60, 60, 60, 60, 60, 60, 80];
      const teamLogoPromises = standings.map((team) => toDataURL(team.logo || "/Play.png"));
      const teamLogoDataUrls = await Promise.all(teamLogoPromises);
      const teamLogos = await Promise.all(
        teamLogoDataUrls.map((url) => {
          const img = document.createElement("img");
          img.src = url as string;
          return new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img);
          });
        }),
      );

      standings.forEach((team, index) => {
        const y = startY + index * rowHeight;
        let x = 40;

        const qualifies = isThirdPlace ? index < 8 : index < 2;
        ctx.fillStyle = index % 2 !== 0 ? "#f9fafb" : "#FFFFFF";
        ctx.fillRect(0, y, canvasWidth, rowHeight);
        
        if (qualifies) {
            ctx.fillStyle = winColor;
            ctx.fillRect(0, y, 10, rowHeight);
        }

        ctx.fillStyle = foregroundColor;
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(String(index + 1), x + colWidths[0] / 2, y + 35);
        x += colWidths[0];

        ctx.textAlign = "left";
        if (teamLogos[index]) {
          ctx.drawImage(teamLogos[index], x + 10, y + (rowHeight - 40) / 2, 40, 40);
        }
        ctx.fillText(team.teamName, x + 60, y + 35);
        x += colWidths[1];

        if (isThirdPlace) {
          ctx.textAlign = "center";
          ctx.font = "20px sans-serif";
          ctx.fillText(team.group, x + colWidths[2] / 2, y + 35);
          x += colWidths[2];
        }

        const stats = [team.played, team.wins, team.draws, team.losses, team.goalsFor, team.goalsAgainst, team.goalDifference, team.teamPoints];
        ctx.textAlign = "center";
        stats.forEach((stat, i) => {
          const colIndex = isThirdPlace ? i + 3 : i + 2;
          ctx.font = "20px sans-serif";
          ctx.fillStyle = foregroundColor;
          if (i === 1) ctx.fillStyle = winColor;
          if (i === 2) ctx.fillStyle = drawColor;
          if (i === 3) ctx.fillStyle = lossColor;
          if (i === 7) ctx.font = "bold 20px sans-serif";
          ctx.fillText(String(stat), x + colWidths[colIndex] / 2, y + 35);
          x += colWidths[colIndex];
        });
      });
      return startY + standings.length * rowHeight;
    };

    const drawLegend = (y: number) => {
      ctx.font = "18px sans-serif";
      ctx.fillStyle = foregroundColor;
      ctx.textAlign = "center";
      ctx.fillText("Legend", canvasWidth / 2, y - 20);
      const legendColWidth = canvasWidth / 4;
      legendTerms.slice(0, 4).forEach((item, index) => {
        ctx.fillText(`${item.term}: ${item.definition}`, 20 + index * legendColWidth + legendColWidth / 2, y);
      });
      legendTerms.slice(4).forEach((item, index) => {
        ctx.fillText(`${item.term}: ${item.definition}`, 20 + index * legendColWidth + legendColWidth / 2, y + 30);
      });
    };

    const drawFooter = (y: number) => {
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Generated by PlayChamp", canvasWidth / 2, y - 15);
    };

    if (tournament.format === "group_then_knockout" && tournament.fixtures) {
      const groups = (tournament.fixtures ?? []).reduce((acc, fixture) => {
        const groupName = fixture.group ?? "default";
        if (!acc[groupName]) acc[groupName] = { fixtures: [], teams: new Set<string>() };
        if (fixture.team1?.id) acc[groupName].teams.add(fixture.team1.id);
        if (fixture.team2?.id) acc[groupName].teams.add(fixture.team2.id);
        acc[groupName].fixtures.push(fixture);
        return acc;
      }, {} as Record<string, { fixtures: Fixture[]; teams: Set<string> }>);

      const sortedGroupNames = Object.keys(groups).sort();
      let thirdPlaceTeams: any[] = [];
      let totalHeight = headerHeight;

      if (tournament.numberOfTeams === 48) {
          Object.keys(groups).forEach(groupName => {
              const groupTeams = teams.filter(t => groups[groupName].teams.has(t.id!));
              const standings = createChartData({
                  tournament: { ...tournament, fixtures: groups[groupName].fixtures },
                  teams: groupTeams
              }).sort((a, b) => b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || b.wins - a.wins);
              if (standings.length > 2) {
                  thirdPlaceTeams.push({ ...standings[2], group: groupName });
              }
          });
          thirdPlaceTeams.sort((a, b) => b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || b.wins - a.wins);
      }

      sortedGroupNames.forEach((groupName) => {
        totalHeight += groupHeaderHeight;
        totalHeight += tableHeaderHeight;
        const groupTeams = teams.filter((t) => groups[groupName].teams.has(t.id!));
        totalHeight += groupTeams.length * rowHeight;
      });

      if (thirdPlaceTeams.length > 0) {
          totalHeight += groupHeaderHeight;
          totalHeight += tableHeaderHeight;
          totalHeight += thirdPlaceTeams.length * rowHeight;
      }
      
      totalHeight += legendHeight;
      canvas.height = totalHeight;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasWidth, canvas.height);
      drawMainHeader();

      let currentY = headerHeight;
      for (const groupName of sortedGroupNames) {
        // Draw blue header
        ctx.fillStyle = "#002366"; // Blue color for the header
        ctx.fillRect(40, currentY, canvasWidth - 80, 50);

        // Draw group name text
        ctx.font = "bold 24px sans-serif";
        ctx.fillStyle = "#FFFFFF"; // White text
        ctx.textAlign = "center";
        ctx.fillText(
          `${t("tournament.standings.group")} ${groupName}`,
          canvasWidth / 2,
          currentY + 35,
        );

        currentY += groupHeaderHeight;
        drawTableHeader(currentY + 20);
        currentY += tableHeaderHeight;
        const groupTeams = teams.filter((t) => groups[groupName].teams.has(t.id!));
        const standingsData = createChartData({
          tournament: { ...tournament, fixtures: groups[groupName].fixtures },
          teams: groupTeams,
        }).sort((a, b) => b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference);
        currentY = await drawTableRows(standingsData, currentY);
      }

      if (thirdPlaceTeams.length > 0) {
          currentY += groupHeaderHeight;
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = foregroundColor;
          ctx.textAlign = "left";
          ctx.fillText(t("tournament.third-place-ranking"), 40, currentY - 20);
          drawTableHeader(currentY + 20, true);
          currentY += tableHeaderHeight;
          currentY = await drawTableRows(thirdPlaceTeams, currentY, true);
      }

      drawLegend(currentY + 50);
      drawFooter(canvas.height);
    } else {
      const standingsData = createChartData({ tournament, teams }).sort(
        (a, b) => b.teamPoints - a.teamPoints || b.goalDifference - a.goalDifference
      );
      canvas.height = headerHeight + tableHeaderHeight + standingsData.length * rowHeight + legendHeight;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasWidth, canvas.height);
      drawMainHeader();
      drawTableHeader(headerHeight + 20);
      const tableEndY = await drawTableRows(standingsData, headerHeight + tableHeaderHeight);
      drawLegend(tableEndY + 50);
      drawFooter(canvas.height);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsExporting(false);
        return;
      }
      const fileName = `${tournament.name}-standings.png`;
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

  const isKnockoutFormat = tournament.format === "knockout";
  const isGroupThenKnockout = tournament.format === "group_then_knockout";
  const bracketUrl = user ? `/${locale}/user/tournament/${tournament.id}/bracket` : `/${locale}/show/${tournament.id}/bracket`;

  return (
    <>
      <TabsContent
        value="overview"
        forceMount={true}
        hidden={activeTab !== "overview"}
      >
        <div className="mt-6 space-y-4">
          <div className="relative h-64 w-full overflow-hidden rounded-lg">
            <Image
              src={
                tournament.coverImageUrl ??
                getTournamentPlaceholder(tournament.id)
              }
              alt={tournament.name}
              fill
              className="object-cover"
            />
            <div className="absolute right-2 top-2 flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                className="h-8 w-8 bg-black/50 hover:bg-black/70"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 text-white",
                    isFavorited && "fill-red-500 text-red-500",
                  )}
                />
                <span className="sr-only">Favorite</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShareTournament}
                className="h-8 w-8 bg-black/50 hover:bg-black/70"
              >
                <Share className="h-4 w-4 text-white" />
                <span className="sr-only">Share Tournament</span>
              </Button>
            </div>
          </div>
          {organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  {t("tournament.organizer")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="h-auto p-0"
                  onClick={() =>
                    router.push(`/${locale}/organizer/${organizer.id}`)
                  }
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={organizer.photoURL ?? ""}
                        alt={organizer.displayName ?? ""}
                      />
                      <AvatarFallback>
                        {organizer.displayName
                          ? organizer.displayName.charAt(0)
                          : organizer.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold md:text-base">
                        {organizer.displayName || organizer.email}
                      </p>
                      <p className="text-xs text-muted-foreground md:text-sm">
                        {t("organizer.view-profile")}
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {t("forms.tournament.description-title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkifiedText
                text={tournament.description || t("no.description")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {t("tournament.match-type-full")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tournament.matchType === "two_leg"
                  ? t("forms.tournament.two_leg")
                  : t("forms.tournament.single_leg")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {t("forms.tournament.rules-title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkifiedText text={tournament.rules || t("no.rules")} />
            </CardContent>
          </Card>
          <CommentSection tournamentId={tournament.id!} />
        </div>
      </TabsContent>

      <TabsContent
        value="teams"
        forceMount={true}
        hidden={activeTab !== "teams"}
        className="mt-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {t("tournament.tabs.teams")} ({teams.length})
            </CardTitle>
            {canManage && (
              <div className="flex gap-2">
                <Dialog
                  open={loadListDialogOpen}
                  onOpenChange={setLoadListDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      {t("forms.tournament.load-list-button")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("forms.tournament.load-list-title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("forms.tournament.load-list-description")}
                      </DialogDescription>
                    </DialogHeader>
                    {isLoadingTeamLists ? (
                      <PulseLoader />
                    ) : savedTeamLists && savedTeamLists.length > 0 ? (
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {savedTeamLists.map((list: any) => (
                            <div
                              key={list.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <span className="font-medium">{list.name}</span>
                              <Button
                                size="sm"
                                onClick={() => handleLoadList(list)}
                                disabled={addMultipleTeamsMutation.isPending}
                              >
                                {addMultipleTeamsMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {t("forms.tournament.load-list-button")}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-muted-foreground">
                        {t("no.saved-lists")}
                      </p>
                    )}
                  </DialogContent>
                </Dialog>

                {teams.length > 0 && (
                  <Dialog
                    open={saveListDialogOpen}
                    onOpenChange={setSaveListDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        {t("forms.tournament.save")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t("forms.tournament.save-list-title")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("forms.tournament.save-list-description")}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...saveTeamListForm}>
                        <form
                          id="save-list-form"
                          onSubmit={saveTeamListForm.handleSubmit(
                            onSaveTeamList,
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={saveTeamListForm.control}
                            name="listName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("forms.tournament.list-name")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t(
                                      "forms.tournament.list-name-placeholder",
                                    )}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">
                            {t("forms.tournament.cancel")}
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          form="save-list-form"
                          disabled={saveTeamListMutation.isPending}
                        >
                          {saveTeamListMutation.isPending
                            ? t("forms.tournament.saving")
                            : t("forms.tournament.save")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {teams.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <Card key={team.id} className="w-full">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Image
                          src={team.logo ?? "/Play.png"}
                          alt={team.name}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <CardDescription>
                        {t("forms.tournament.roster")}
                      </CardDescription>
                      {team.roster && team.roster.length > 0 ? (
                        <ul className="list-inside list-disc text-sm">
                          {team.roster.map((player, index) => (
                            <li key={index}>{player}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("no.roster")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <p>{t("no.teams")}</p>
                {canManage && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/${locale}/user/tournament/${tournament.id}/teams`,
                      )
                    }
                  >
                    {t("tournament.add-edit-teams")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="fixtures"
        forceMount={true}
        hidden={activeTab !== "fixtures"}
      >
        <FixturesPreview
          fixtures={tournament.fixtures ?? []}
          canManage={canManage}
          teams={teams}
          tournamentId={tournament.id!}
          tournament={tournament}
          tournamentFormat={tournament.format}
          numberOfTeams={tournament.numberOfTeams}
          matchType={tournament.matchType}
          matches={matches}
          selectedStage={selectedStage}
          selectedRound={selectedRound}
          isRoundFlipped={isRoundFlipped}
        />
      </TabsContent>

      <TabsContent
        value="standings"
        forceMount={true}
        hidden={activeTab !== "standings"}
      >
        <div className="mt-6">
          {winner && <WinnerCard winner={winner} tournament={tournament} />}
          {isKnockoutFormat ? (
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  router.push(bracketUrl)
                }
              >
                View Bracket
              </Button>
            </div>
          ) : (
            <div id="standings-table">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("tournament.tabs.standings")}</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportStandingsAsImage}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <StandingsTable tournament={tournament} teams={teams} />
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>
                    {t("tournament.standings_definitions.legend")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
                    {legendTerms.map((item) => (
                      <div
                        key={item.term}
                        className="flex items-center gap-2 text-xs md:text-sm"
                      >
                        <span className={cn("font-bold", item.color)}>
                          {item.term}:
                        </span>
                        <span className="text-muted-foreground">
                          {item.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {isGroupThenKnockout && (
             <div className="mt-4 flex justify-center">
              <Button
                onClick={() =>
                  router.push(bracketUrl)
                }
              >
                View Bracket
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </>
  );
}
