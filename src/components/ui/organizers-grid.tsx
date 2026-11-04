
"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
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
  const db = getFirestore(app);

  React.useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(12));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as UserProfile,
        );
        setOrganizers(usersList);
      } catch (error) {
        console.error("Error fetching organizers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, [db]);

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
