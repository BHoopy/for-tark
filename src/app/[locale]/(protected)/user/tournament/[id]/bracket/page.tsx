"use client";

import React from "react";
import { useParams } from "next/navigation";
import { getSql } from "@/lib/neon";
import { useTournamentsById } from "@/backend-calls";
import { Match, teamBody } from "@/types/types";
import { transformMatchesToBracketData } from "@/lib/g-loot-transformer";
import { UserNav } from "@/components/navbar/user-nav";
import PulseLoader from "@/components/ui/pulse-loader";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SeedProps {
  match: any;
}

const Seed = ({ match }: SeedProps) => {
  const team1 = match.teams[0];
  const team2 = match.teams[1];

  return (
    <div className="relative flex flex-col justify-center">
      <div
        className={cn(
          "relative z-10 flex w-56 flex-col justify-center rounded-md border bg-card shadow-sm",
          match.isBronzeMatch && "border-amber-700/60"
        )}
      >
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Image
              src={team1?.logo || "/Play.png"}
              alt={team1?.name || "TBD"}
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className="flex-1 truncate text-sm font-medium">
              {team1?.name || "TBD"}
            </span>
          </div>
          <span className="text-sm font-bold">{team1?.score ?? "-"}</span>
        </div>
        <div className="border-t"></div>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Image
              src={team2?.logo || "/Play.png"}
              alt={team2?.name || "TBD"}
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className="flex-1 truncate text-sm font-medium">
              {team2?.name || "TBD"}
            </span>
          </div>
          <span className="text-sm font-bold">{team2?.score ?? "-"}</span>
        </div>
      </div>
    </div>
  );
};

interface RoundProps {
  title: string;
  seeds: any[];
}

const Round = ({ title, seeds }: RoundProps) => {
    return (
      <div className="flex h-full flex-col items-center justify-around gap-8">
        <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
        <div className="flex h-full flex-col items-center justify-around gap-12">
          {seeds.map((seed) => (
            <div key={seed.id} className="relative">
              <Seed match={seed} />
            </div>
          ))}
        </div>
      </div>
    );
};

const FinalRound = ({ title, seeds }: RoundProps) => {
  const finalMatch = seeds.find((seed) => !seed.isBronzeMatch);
  const bronzeMatch = seeds.find((seed) => seed.isBronzeMatch);

  return (
    <div className="flex h-full flex-col items-center justify-around gap-8">
      <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
      <div className="flex h-full flex-col items-center justify-around gap-12">
        {finalMatch && (
            <div key={finalMatch.id} className="relative">
                <Seed match={finalMatch} />
            </div>
        )}
        {bronzeMatch && (
          <>
            <h4 className="mt-8 text-md font-semibold text-muted-foreground">3rd Place Finalist</h4>
            <div key={bronzeMatch.id} className="relative">
                <Seed match={bronzeMatch} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const getRoundLabel = (
  roundIndex: number, // 0-based index of the round
  totalRounds: number,
  t: (key: string, values?: any) => string,
): string => {
  if (roundIndex === totalRounds - 1) return t("tournament.final");
  if (roundIndex === totalRounds - 2) return t("tournament.semi-finals");
  if (roundIndex === totalRounds - 3) return t("tournament.quarter-finals");

  const teamsInRound = Math.pow(2, totalRounds - roundIndex);
  return t("tournament.round-of", { count: teamsInRound });
};

export default function BracketPage() {
  const { id } = useParams();
  const tournamentId = Array.isArray(id) ? id[0] : id;
  const locale = useLocale();
  const t = useTranslations();

  const { data: tournament, isLoading: isLoadingTournament } =
    useTournamentsById({ id: tournamentId });
  const [teams, setTeams] = React.useState<teamBody[]>([]);
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [rounds, setRounds] = React.useState<any[]>([]);

  const fetchTeams = React.useCallback(async () => {
    if (!tournamentId) return;
    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, color, roster, logo
      FROM teams
      WHERE tournament_id = ${tournamentId}
    `) as any[];
    setTeams(
      (rows ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? undefined,
        roster: r.roster ?? [],
        logo: r.logo ?? undefined,
      })) as teamBody[],
    );
  }, [tournamentId]);

  const fetchMatches = React.useCallback(async () => {
    if (!tournamentId) return;
    const sql = getSql();
    const rows = (await sql`
      SELECT id, round, match_number, team1_id, team2_id,
             score1_leg1, score2_leg1, score1_leg2, score2_leg2,
             status, next_match_id, is_bronze_match
      FROM matches
      WHERE tournament_id = ${tournamentId}
    `) as any[];
    setMatches(
      (rows ?? []).map((r) => ({
        id: r.id,
        round: r.round,
        matchNumber: r.match_number,
        team1Id: r.team1_id,
        team2Id: r.team2_id,
        score1_leg1: r.score1_leg1,
        score2_leg1: r.score2_leg1,
        score1_leg2: r.score1_leg2,
        score2_leg2: r.score2_leg2,
        status: r.status,
        nextMatchId: r.next_match_id,
        isBronzeMatch: r.is_bronze_match,
      })) as Match[],
    );
  }, [tournamentId]);

  React.useEffect(() => {
    if (!tournamentId) return;
    const load = () => {
      fetchTeams();
      fetchMatches();
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, fetchTeams, fetchMatches]);

  React.useEffect(() => {
    if (matches.length > 0 && tournament && teams.length > 0) {
      const bracketData = transformMatchesToBracketData(
        matches,
        teams,
        tournament,
      );
      setRounds(bracketData);
    }
  }, [matches, teams, tournament]);

  const handleShare = async () => {
    const shareData = {
      title: `${tournament?.name} Bracket`,
      text: `View the "${tournament?.name}" bracket`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to copy link
        navigator.clipboard.writeText(shareData.url).then(
          () => {
            toast({
              title: "URL Copied!",
              description:
                "The tournament bracket link has been copied to your clipboard.",
            });
          },
          () => {
            toast({
              title: "Failed to copy",
              variant: "destructive",
            });
          },
        );
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareData.url).then(
        () => {
          toast({
            title: "URL Copied!",
            description:
              "The tournament bracket link has been copied to your clipboard.",
          });
        },
        () => {
          toast({
            title: "Failed to copy",
            variant: "destructive",
          });
        },
      );
    }
  };

  if (isLoadingTournament || rounds.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <PulseLoader />
        <p className="mt-4 text-muted-foreground">Loading bracket...</p>
      </div>
    );
  }
  
  const totalRounds = rounds.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <UserNav
        title={`${tournament?.name} - Bracket`}
        isBack={true}
        backPath={`/${locale}/user/tournament/${tournamentId}`}
      >
        <Button variant="outline" onClick={handleShare}>
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
      </UserNav>
      <main className="flex flex-1 overflow-x-auto p-4">
        <div className="mx-auto my-8 flex min-w-max items-start justify-center gap-16">
          {rounds.map((round, idx) => {
             const isFinalRound = idx === totalRounds - 1;
             if (isFinalRound) {
                 return (
                    <FinalRound
                        key={round.title}
                        title={getRoundLabel(idx, rounds.length, t)}
                        seeds={round.seeds}
                    />
                 )
             }
            return (
                <Round
                    key={round.title}
                    title={getRoundLabel(idx, rounds.length, t)}
                    seeds={round.seeds}
                />
            )
          })}
        </div>
      </main>
    </div>
  );
}