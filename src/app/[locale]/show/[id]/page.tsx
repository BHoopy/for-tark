"use client";
import React from "react";
import PulseLoader from "@/components/ui/pulse-loader";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useTournamentsById } from "@/backend-calls";
import { useParams } from "next/navigation";
import { getSql } from "@/lib/neon";
import { teamBody, Match, UserProfile } from "@/types/types";
import { TournamentHeader } from "@/components/ui/tournament-header";
import { TournamentTabsContent } from "@/components/ui/tournament-tabs-content";
import { Tabs } from "@/components/ui/tabs";

export default function ShowTournamentPage() {
  const { id } = useParams();
  const tournamentId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedStage, setSelectedStage] = React.useState("group_stage");
  const [selectedRound, setSelectedRound] = React.useState("1");
  const [isRoundFlipped, setIsRoundFlipped] = React.useState(false);
  const [organizer, setOrganizer] = React.useState<UserProfile | null>(null);

  const {
    data: tournament,
    isLoading,
    isError,
  } = useTournamentsById({ id: tournamentId, refetchInterval: 5000 });

  const [teams, setTeams] = React.useState<teamBody[]>([]);
  const [matches, setMatches] = React.useState<Match[]>([]);

  const fetchTeams = React.useCallback(async () => {
    if (!tournamentId) return;
    try {
      const sql = getSql();
      const rows = (await sql`
        SELECT id, tournament_id, name, color, roster, logo
        FROM teams
        WHERE tournament_id = ${tournamentId}
      `) as any[];
      setTeams(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color,
          roster: r.roster ?? [],
          logo: r.logo,
        })) as teamBody[],
      );
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    }
  }, [tournamentId]);

  const fetchMatches = React.useCallback(async () => {
    if (!tournamentId) return;
    try {
      const sql = getSql();
      const rows = (await sql`
        SELECT id, tournament_id, round, match_number, team1_id, team2_id,
               score1_leg1, score2_leg1, score1_leg2, score2_leg2, status,
               next_match_id, is_bronze_match
        FROM matches
        WHERE tournament_id = ${tournamentId}
      `) as any[];
      setMatches(
        rows.map((r) => ({
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
    } catch (e) {
      console.error("Failed to fetch matches:", e);
    }
  }, [tournamentId]);

  React.useEffect(() => {
    if (!tournamentId) return;
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, fetchTeams]);

  React.useEffect(() => {
    if (!tournamentId) return;
    if (
      tournament?.format !== "knockout" &&
      tournament?.format !== "group_then_knockout"
    ) {
      return;
    }
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, tournament?.format, fetchMatches]);

  React.useEffect(() => {
    const fetchOrganizer = async () => {
      if (tournament?.createdBy) {
        try {
          const sql = getSql();
          const rows = (await sql`
            SELECT id, uid, display_name, email, photo_url, cover_image_url,
                   whatsapp, x, facebook, phone, discord, favorite_tournaments
            FROM users
            WHERE uid = ${tournament.createdBy}
            LIMIT 1
          `) as any[];
          if (rows && rows.length > 0) {
            const r = rows[0];
            setOrganizer({
              id: r.id,
              uid: r.uid,
              displayName: r.display_name,
              email: r.email,
              photoURL: r.photo_url,
              coverImageURL: r.cover_image_url,
              whatsapp: r.whatsapp,
              x: r.x,
              facebook: r.facebook,
              phone: r.phone,
              discord: r.discord,
              favoriteTournaments: r.favorite_tournaments ?? [],
            } as UserProfile);
          }
        } catch (e) {
          console.error("Failed to fetch organizer:", e);
        }
      }
    };
    fetchOrganizer();
  }, [tournament?.createdBy]);

  React.useEffect(() => {
    if (tournament?.format) {
      setSelectedStage(
        tournament.format === "group_then_knockout"
          ? "group_stage"
          : tournament.format === "knockout"
          ? "knockout"
          : "group_stage",
      );
    }
  }, [tournament?.format]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <PulseLoader />
      </div>
    );
  }

  if (isError || !tournament) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Error loading tournament data.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative"
      >
        <TournamentHeader
          tournament={tournament}
          teams={teams}
          matches={matches}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          canManage={false}
          isPublic
          selectedStage={selectedStage}
          onStageChange={setSelectedStage}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
          isRoundFlipped={isRoundFlipped}
          onRoundFlip={setIsRoundFlipped}
        />

        <main className="container mx-auto flex-1 p-4">
          <TournamentTabsContent
            activeTab={activeTab}
            tournament={tournament}
            teams={teams}
            matches={matches}
            organizer={organizer}
            canManage={false}
            selectedStage={selectedStage}
            selectedRound={selectedRound}
            isRoundFlipped={isRoundFlipped}
          />
        </main>
      </Tabs>
      <DonationBanner /><Footer />
    </div>
  );
}