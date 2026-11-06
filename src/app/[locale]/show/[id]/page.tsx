"use client";
import React from "react";
import PulseLoader from "@/components/ui/pulse-loader";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useTournamentsById } from "@/backend-calls";
import { useParams } from "next/navigation";
import {
  getTournamentTeams,
  getTournamentMatches,
} from "@/lib/server-actions/teams";
import { getUserByIdentifier } from "@/lib/server-actions/users";
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
      const rows = await getTournamentTeams(tournamentId);
      setTeams(rows);
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    }
  }, [tournamentId]);

  const fetchMatches = React.useCallback(async () => {
    if (!tournamentId) return;
    try {
      const rows = await getTournamentMatches(tournamentId);
      setMatches(rows);
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
          const userData = await getUserByIdentifier(tournament.createdBy);
          if (userData) {
            setOrganizer(userData);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="relative">
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
      <DonationBanner />
      <Footer />
    </div>
  );
}
