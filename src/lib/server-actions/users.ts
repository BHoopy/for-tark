"use server";

import { getSql } from "@/lib/neon";
import { getSessionUser } from "@/lib/auth";
import type { UserProfile } from "@/types/types";

function mapUserRow(r: Record<string, any>): UserProfile {
  return {
    id: String(r.id),
    uid: r.uid,
    displayName: r.display_name,
    email: r.email,
    photoURL: r.photo_url,
    coverImageURL: r.cover_image_url,
    whatsapp: r.whatsapp,
    x: r.x,
    facebook: r.facebook,
    phone: r.phone,
    discord: r.discord,
    favoriteTournaments: r.favorite_tournaments ?? [],
  };
}

async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function getUserByIdentifier(
  identifier: string,
): Promise<UserProfile | null> {
  if (!identifier) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT id, uid, display_name, email, photo_url, cover_image_url,
           whatsapp, x, facebook, phone, discord, favorite_tournaments
    FROM psimply.users
    WHERE uid = ${identifier} OR id = ${identifier}
    LIMIT 1
  `) as Record<string, any>[];

  return rows?.[0] ? mapUserRow(rows[0]) : null;
}

export async function listUsers(limit = 12): Promise<UserProfile[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const sql = getSql();
  const rows = (await sql`
    SELECT id, uid, display_name, email, photo_url, cover_image_url,
           whatsapp, x, facebook, phone, discord, favorite_tournaments
    FROM psimply.users
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `) as Record<string, any>[];

  return (rows ?? []).map(mapUserRow);
}

export async function findUsers(searchTerm: string): Promise<UserProfile[]> {
  const term = searchTerm.trim();
  if (!term) return [];

  const sql = getSql();
  const rows = (await sql`
    SELECT id, uid, display_name, email, photo_url, cover_image_url,
           whatsapp, x, facebook, phone, discord, favorite_tournaments
    FROM psimply.users
    WHERE email ILIKE ${term + "%"}
    LIMIT 10
  `) as Record<string, any>[];

  return (rows ?? []).map(mapUserRow);
}

export async function updateUserFavorites(
  userId: string,
  tournamentId: string,
  action: "add" | "remove",
): Promise<void> {
  const sessionUser = await requireSession();
  if (userId !== sessionUser.uid && userId !== sessionUser.id) {
    throw new Error("You can only update your own favorites.");
  }

  const sql = getSql();

  if (action === "add") {
    await sql`
      UPDATE psimply.users
      SET favorite_tournaments = CASE
        WHEN ${tournamentId} = ANY(COALESCE(favorite_tournaments, '{}'))
          THEN favorite_tournaments
        ELSE array_append(COALESCE(favorite_tournaments, '{}'), ${tournamentId})
      END,
          updated_at = NOW()
      WHERE uid = ${userId} OR id = ${userId}
    `;
  } else {
    await sql`
      UPDATE psimply.users
      SET favorite_tournaments = array_remove(
        COALESCE(favorite_tournaments, '{}'),
        ${tournamentId}
      ),
          updated_at = NOW()
      WHERE uid = ${userId} OR id = ${userId}
    `;
  }
}
