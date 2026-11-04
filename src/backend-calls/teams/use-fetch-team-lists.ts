
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  orderBy,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { TeamList } from "@/types/types";
import { usersQueryKeys } from "../users";

export function useFetchTeamLists(userId?: string) {
  const db = getFirestore(app);

  const fetchTeamListsFn = async (): Promise<TeamList[]> => {
    if (!userId) {
      return [];
    }

    const teamListsRef = collection(db, "users", userId, "teamLists");
    const q = query(teamListsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as TeamList,
    );
  };

  return useQuery({
    queryKey: usersQueryKeys.teamLists(userId),
    queryFn: fetchTeamListsFn,
    enabled: !!userId,
  });
}
