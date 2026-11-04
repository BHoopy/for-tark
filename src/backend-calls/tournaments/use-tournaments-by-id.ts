
import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { firestoreTimestampToDate } from "@/lib/firestore-helpers";

type Props = {
  id: string;
  refetchInterval?: number;
};

export function useTournamentsById({ id, refetchInterval }: Props) {
  const db = getFirestore(app);
  async function getTournamentsByIdFn(id: string) {
    const tournamentRef = doc(db, "tournaments", id);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) {
      throw new Error("Tournament not found");
    }

    const data = tournamentDoc.data() as tournamentBody;
    const tournament = {
      id: tournamentDoc.id,
      ...data,
      createdAt: firestoreTimestampToDate(data.createdAt as any),
    };
    return tournament as tournamentBody;
  }
  return useQuery({
    queryKey: tournamentsQueryKeys.tournament(id),
    queryFn: () => getTournamentsByIdFn(id),
    refetchInterval: refetchInterval ?? 0,
    enabled: !!id,
  });
}
