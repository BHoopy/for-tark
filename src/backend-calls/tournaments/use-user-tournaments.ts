
import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { processFirestoreDocs } from "@/lib/firestore-helpers";

type Props = {
  userId?: string;
};

export function useUserTournaments({ userId }: Props = {}) {
  const db = getFirestore(app);

  async function getUserTournamentsFn(): Promise<tournamentBody[]> {
    if (!userId) return [];

    const tournamentsRef = collection(db, "tournaments");
    const q = query(
      tournamentsRef,
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const tournamentsData = await getDocs(q);

    return processFirestoreDocs(tournamentsData);
  }

  return useQuery<tournamentBody[]>({
    queryKey: tournamentsQueryKeys.userTournaments(userId),
    queryFn: getUserTournamentsFn,
    enabled: !!userId,
    throwOnError: true,
  });
}
