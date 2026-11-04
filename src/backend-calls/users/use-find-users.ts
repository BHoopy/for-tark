import { useQuery } from "@tanstack/react-query";
import { getSql } from "@/lib/neon";
import { UserProfile } from "@/types/types";
import { usersQueryKeys } from "./users-query-keys";

export function useFindUsers(searchTerm: string) {
  const findUsersFn = async (): Promise<UserProfile[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    const sql = getSql();
    const term = searchTerm.trim();
    const rows = (await sql`
      SELECT id, uid, display_name, email, photo_url, cover_image_url,
             whatsapp, x, facebook, phone, discord, favorite_tournaments
      FROM users
      WHERE email >= ${term} AND email <= ${term + "\uf8ff"}
      LIMIT 10
    `) as any[];

    return (rows ?? []).map((r: any) => ({
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
    })) as UserProfile[];
  };

  return useQuery({
    queryKey: usersQueryKeys.search(searchTerm),
    queryFn: findUsersFn,
    enabled: !!searchTerm, // Only run query if searchTerm is not empty
  });
}
