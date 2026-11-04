
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { usersQueryKeys } from "./users-query-keys";
import { UserProfile } from "@/types/types";

export function useUserById(userId: string) {
  const db = getFirestore(app);

  const fetchUser = async () => {
    if (!userId) throw new Error("User ID is required.");

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User not found.");
    }

    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  };

  return useQuery({
    queryKey: usersQueryKeys.user(userId),
    queryFn: fetchUser,
    enabled: !!userId,
  });
}
