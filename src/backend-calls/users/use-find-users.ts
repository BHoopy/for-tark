import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types/types";
import { usersQueryKeys } from "./users-query-keys";
import { findUsers } from "@/lib/server-actions/users";

export function useFindUsers(searchTerm: string) {
  const findUsersFn = async (): Promise<UserProfile[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    return findUsers(searchTerm);
  };

  return useQuery({
    queryKey: usersQueryKeys.search(searchTerm),
    queryFn: findUsersFn,
    enabled: !!searchTerm,
  });
}
