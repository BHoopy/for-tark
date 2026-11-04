
import { tournamentsQueryKeys } from "@/backend-calls";
import { useQuery } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import {
  collection,
  getCountFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  DocumentSnapshot,
  DocumentData,
  Query,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { processFirestoreDocs } from "@/lib/firestore-helpers";

type Props = {
  page: number;
  pageLimit: number;
};

type Response = {
  tournaments: tournamentBody[];
  totalPages: number;
};

const pageCache: { [key: number]: DocumentSnapshot<DocumentData> } = {};

export function usePaginatedTournaments({ page, pageLimit }: Props) {
  const db = getFirestore(app);

  async function getPaginatedTournamentsFn(
    page: number,
  ): Promise<Response> {
    const tournamentsCollection = collection(db, "tournaments");

    const countSnapshot = await getCountFromServer(tournamentsCollection);
    const totalCount = countSnapshot.data().count;
    const totalPages = Math.ceil(totalCount / pageLimit);

    let q: Query<DocumentData>;

    if (page === 1) {
      q = query(
        tournamentsCollection,
        limit(pageLimit),
      );
    } else {
      const lastVisibleDoc = pageCache[page - 1];
      if (!lastVisibleDoc) {
        // This case can happen if the cache is cleared or if the user jumps pages.
        // A more robust solution might fetch pages sequentially to fill the cache.
        // For now, we'll just log a warning and fetch from the beginning.
        console.warn(`No cached document for page ${page - 1}. Fetching from start.`);
        q = query(
          tournamentsCollection,
          limit(pageLimit * (page -1) + 1)
        );
      } else {
         q = query(
          tournamentsCollection,
          startAfter(lastVisibleDoc),
          limit(pageLimit),
        );
      }
    }

    const tournamentsData = await getDocs(q);

    if (!tournamentsData.empty) {
      pageCache[page] = tournamentsData.docs[tournamentsData.docs.length - 1];
    }
    
    // Invalidate future page caches if we are on the first page
    if (page === 1) {
      Object.keys(pageCache).forEach(key => {
        if(parseInt(key) > 1) {
          delete pageCache[parseInt(key)];
        }
      })
    }

    const tournaments = processFirestoreDocs(tournamentsData);

    return { tournaments, totalPages };
  }

  return useQuery<Response>({
    queryKey: tournamentsQueryKeys.pagination(page),
    queryFn: () => getPaginatedTournamentsFn(page),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
