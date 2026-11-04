"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { getSql } from "@/lib/neon";
import React from "react";
import { UserProfile } from "@/types/types";
import PulseLoader from "./pulse-loader";
import { Button } from "./button";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function OrganizersGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [organizers, setOrganizers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const sql = getSql();
        const rows = (await sql`
          SELECT id, uid, display_name, email, photo_url, cover_image_url,
                 whatsapp, x, facebook, phone, discord, favorite_tournaments
          FROM users
          LIMIT 12
        `) as any[];
        const usersList = (rows ?? []).map((r: any) => ({
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
        })) as UserProfile[];
        setOrganizers(usersList);
      } catch (error) {
        console.error("Error fetching organizers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, []);

  if (loading) {
    return <PulseLoader />;
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">
        {t("tournament.organizers")}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {organizers.map((organizer) => (
          <Button
            key={organizer.id}
            variant="ghost"
            className="h-auto p-0"
            onClick={() => router.push(`/${locale}/organizer/${organizer.id}`)}
          >
            <Card className="w-full overflow-hidden border-0 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-2">
                <Avatar className="h-24 w-24 rounded-lg">
                  <AvatarImage
                    src={organizer.photoURL ?? ""}
                    alt={organizer.displayName ?? ""}
                  />
                  <AvatarFallback>
                    {organizer.displayName
                      ? organizer.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : organizer.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-2 text-center text-sm font-medium">
                  {organizer.displayName || organizer.email}
                </p>
              </CardContent>
            </Card>
          </Button>
        ))}
      </div>
    </div>
  );
}