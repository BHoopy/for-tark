
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  limit,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { UserProfile } from "@/types/types";
import { usersQueryKeys } from "./users-query-keys";

export function useFindUsers(searchTerm: string) {
  const db = getFirestore(app);

  const findUsersFn = async (): Promise<UserProfile[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    const usersRef = collection(db, "users");
    // Since Firestore doesn't support partial string searches natively,
    // we fetch users with email >= search term and then filter locally.
    // This is not ideal for large datasets but works for smaller scale.
    // A more scalable solution would involve a third-party search service like Algolia.
    const q = query(
      usersRef,
      where("email", ">=", searchTerm),
      where("email", "<=", searchTerm + "\uf8ff"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserProfile);
    });

    return users;
  };

  return useQuery({
    queryKey: usersQueryKeys.search(searchTerm),
    queryFn: findUsersFn,
    enabled: !!searchTerm, // Only run query if searchTerm is not empty
  });
}
