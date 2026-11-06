import { useQuery } from "@tanstack/react-query";
import { usersQueryKeys } from "./users-query-keys";
import { UserProfile } from "@/types/types";
import { getUserByIdentifier } from "@/lib/server-actions/users";

export function useUserById(userId: string) {
  const fetchUser = async (): Promise<UserProfile> => {
    if (!userId) throw new Error("User ID is required.");

    const user = await getUserByIdentifier(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  };

  return useQuery({
    queryKey: usersQueryKeys.user(userId),
    queryFn: fetchUser,
    enabled: !!userId,
  });
}
