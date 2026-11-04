import { useQuery } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { usersQueryKeys } from "./users-query-keys";
import { UserProfile } from "@/types/types";

export function useUserById(userId: string) {
  const fetchUser = async () => {
    if (!userId) throw new Error("User ID is required.");

    const sql = getSql();
    const rows = (await sql`
      SELECT id, uid, display_name, email, photo_url, cover_image_url,
             whatsapp, x, facebook, phone, discord, favorite_tournaments
      FROM users
      WHERE uid = ${userId} OR id = ${userId}
      LIMIT 1
    `) as any[];

    if (!rows || rows.length === 0) {
      throw new Error("User not found.");
    }

    const r = rows[0];
    return {
      id: r.id,
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
    } as UserProfile;
  };

  return useQuery({
    queryKey: usersQueryKeys.user(userId),
    queryFn: fetchUser,
    enabled: !!userId,
  });
}