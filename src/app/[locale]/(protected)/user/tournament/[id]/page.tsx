"use client";
import React from "react";
import { useUser } from "@/hooks/use-user";
import PulseLoader from "@/components/ui/pulse-loader";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useTournamentsById } from "@/backend-calls";
import { useParams } from "next/navigation";
import { getSql } from "@/lib/neon";
import { Match, teamBody, UserProfile } from "@/types/types";
import { TournamentHeader } from "@/components/ui/tournament-header";
import { TournamentTabsContent } from "@/components/ui/tournament-tabs-content";
import { Tabs } from "@/components/ui/tabs";

export default function TournamentPage() {
  const { user } = useUser();
  const { id } = useParams();
  const tournamentId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedStage, setSelectedStage] = React.useState("group_stage");
  const [selectedRound, setSelectedRound] = React.useState("1");
  const [isRoundFlipped, setIsRoundFlipped] = React.useState(false);

  const {
    data: tournament,
    isLoading,
    isError,
  } = useTournamentsById({ id: tournamentId, refetchInterval: 5000 });

  const [teams, setTeams] = React.useState<teamBody[]>([]);
  const [organizer, setOrganizer] = React.useState<UserProfile | null>(null);
  const [matches, setMatches] = React.useState<Match[]>([]);

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
    const isKnockout =
      tournament?.format === "knockout" ||
      tournament?.format === "group_then_knockout";

    const load = () => {
      fetchTeams();
      if (isKnockout) fetchMatches();
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, tournament?.format, fetchTeams, fetchMatches]);

  React.useEffect(() => {
    const fetchOrganizer = async () => {
      if (tournament?.createdBy) {
        const sql = getSql();
        const rows = (await sql`
          SELECT id, uid, display_name, email, photo_url, cover_image_url,
                 whatsapp, x, facebook, phone, discord, favorite_tournaments
          FROM users
          WHERE uid = ${tournament.createdBy} OR id = ${tournament.createdBy}
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

  const canManage =
    !!user &&
    (user.uid === tournament?.createdBy ||
      !!tournament?.moderators?.includes(user.uid));

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
          canManage={canManage}
          selectedStage={selectedStage}
          onStageChange={setSelectedStage}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
          isRoundFlipped={isRoundFlipped}
          onRoundFlip={setIsRoundFlipped}
        />
        <main id="main-content" className="container mx-auto flex-1 p-4">
          <TournamentTabsContent
            activeTab={activeTab}
            tournament={tournament}
            teams={teams}
            matches={matches}
            organizer={organizer}
            canManage={canManage}
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