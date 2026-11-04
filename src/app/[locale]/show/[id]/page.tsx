
"use client";
import React from "react";
import PulseLoader from "@/components/ui/pulse-loader";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useTournamentsById } from "@/backend-calls";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { teamBody, Match, UserProfile } from "@/types/types";
import { TournamentHeader } from "@/components/ui/tournament-header";
import { TournamentTabsContent } from "@/components/ui/tournament-tabs-content";
import { Tabs } from "@/components/ui/tabs";

export default function ShowTournamentPage() {
  const { id } = useParams();
  const tournamentId = Array.isArray(id) ? id[0] : id;
  const db = getFirestore(app);

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

  React.useEffect(() => {
    if (!tournamentId) return;
    const teamsCol = collection(db, "tournaments", tournamentId, "teams");
    const unsubscribe = onSnapshot(teamsCol, (snapshot) => {
      const teamsList = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as teamBody,
      );
      setTeams(teamsList);
    });

    if (
      tournament?.format === "knockout" ||
      tournament?.format === "group_then_knockout"
    ) {
      const matchesCol = collection(db, "tournaments", tournamentId, "matches");
      const matchesUnsubscribe = onSnapshot(matchesCol, (snapshot) => {
        const matchesList = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Match,
        );
        setMatches(matchesList);
      });
      return () => {
        unsubscribe();
        matchesUnsubscribe();
      };
    }

    return () => unsubscribe();
  }, [tournamentId, db, tournament?.format]);

  React.useEffect(() => {
    const fetchOrganizer = async () => {
      if (tournament?.createdBy) {
        const userDocRef = doc(db, "users", tournament.createdBy);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setOrganizer({ id: userDoc.id, ...userDoc.data() } as UserProfile);
        }
      }
    };
    fetchOrganizer();
  }, [tournament?.createdBy, db]);

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
