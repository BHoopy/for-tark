"use client";

import { useQuery } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { Comment } from "@/types/types";
import { commentsQueryKeys } from "./comments-query-keys";

export function useFetchComments(tournamentId: string) {
  const fetchComments = async (): Promise<Comment[]> => {
    if (!tournamentId) {
      return [];
    }

    const sql = getSql();
    const rows = (await sql`
      SELECT id, tournament_id, text, created_by, author_name, author_photo_url, created_at
      FROM comments
      WHERE tournament_id = ${tournamentId}
      ORDER BY created_at DESC
    `) as any[];

    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      createdBy: r.created_by,
      authorName: r.author_name,
      authorPhotoURL: r.author_photo_url,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : r.created_at,
    })) as Comment[];
  };

  return useQuery({
    queryKey: commentsQueryKeys.comments(tournamentId),
    queryFn: fetchComments,
    enabled: !!tournamentId,
  });
}