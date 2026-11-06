"use server";

import { getSql } from "@/lib/neon";
import { getSessionUser } from "@/lib/auth";
import type { Comment } from "@/types/types";

export async function getComments(tournamentId: string): Promise<Comment[]> {
  if (!tournamentId) return [];

  const sql = getSql();
  const rows = (await sql`
    SELECT id, tournament_id, text, created_by, author_name,
           author_photo_url, created_at
    FROM psimply.comments
    WHERE tournament_id = ${tournamentId}
    ORDER BY created_at DESC
  `) as Record<string, any>[];

  return (rows ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    createdBy: r.created_by,
    authorName: r.author_name,
    authorPhotoURL: r.author_photo_url,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  })) as Comment[];
}

export async function addComment(
  tournamentId: string,
  text: string,
): Promise<Comment> {
  const user = await getSessionUser();
  if (!user) throw new Error("User not authenticated.");
  if (!text.trim()) throw new Error("Comment cannot be empty.");

  const sql = getSql();
  const rows = (await sql`
    INSERT INTO psimply.comments (
      id, tournament_id, text, created_by,
      author_name, author_photo_url, created_at
    )
    VALUES (
      gen_random_uuid()::text,
      ${tournamentId},
      ${text},
      ${user.uid},
      ${user.displayName || "Anonymous"},
      ${user.photoURL},
      now()
    )
    RETURNING id, tournament_id, text, created_by,
              author_name, author_photo_url, created_at
  `) as Record<string, any>[];

  const r = rows[0];
  return {
    id: r.id,
    text: r.text,
    createdBy: r.created_by,
    authorName: r.author_name,
    authorPhotoURL: r.author_photo_url,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  } as Comment;
}
