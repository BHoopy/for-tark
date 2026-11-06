"use client";

import { useQuery } from "@tanstack/react-query";
import { Comment } from "@/types/types";
import { commentsQueryKeys } from "./comments-query-keys";
import { getComments } from "@/lib/server-actions/comments";

export function useFetchComments(tournamentId: string) {
  const fetchComments = async (): Promise<Comment[]> => {
    if (!tournamentId) {
      return [];
    }

    return getComments(tournamentId);
  };

  return useQuery({
    queryKey: commentsQueryKeys.comments(tournamentId),
    queryFn: fetchComments,
    enabled: !!tournamentId,
  });
}
