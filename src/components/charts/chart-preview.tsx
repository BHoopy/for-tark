
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import { tournamentBody } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getTournamentPlaceholder } from "@/lib/tournament-placeholders";

type ChartPreviewProps = {
  tournament: tournamentBody;
  link: string;
};

export default function ChartPreview({ tournament, link }: ChartPreviewProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [organizer, setOrganizer] = React.useState<{
    name: string | null;
    photoURL: string | null;
  }>({ name: null, photoURL: null });

  const db = getFirestore(app);

  React.useEffect(() => {
    const fetchOrganizer = async () => {
      if (!tournament.createdBy) return;
      try {
        const userDocRef = doc(db, "users", tournament.createdBy);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOrganizer({
            name: userData.displayName ?? userData.email ?? "Unknown",
            photoURL: userData.photoURL ?? null,
          });
        } else {
          setOrganizer({
            name: "Unknown organizer",
            photoURL: null,
          });
        }
      } catch (error) {
        console.error("Error fetching organizer:", error);
        setOrganizer({
          name: "Unknown organizer",
          photoURL: null,
        });
      }
    };
    fetchOrganizer();
  }, [tournament.createdBy, db]);

  return (
    <Card
      className="w-full overflow-hidden transition ease-in-out hover:scale-[102%] delay-50 cursor-pointer"
      onClick={() => {
        router.push(link + tournament.id);
      }}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={
              tournament.coverImageUrl ??
              getTournamentPlaceholder(tournament.id)
            }
            alt={tournament.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <CardTitle className="absolute bottom-4 left-4 text-2xl font-bold text-white">
            {tournament.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardDescription>
          {t("tournament.format")}:{" "}
          <span className="font-semibold text-foreground">{t(`forms.tournament.${tournament.format}`)}</span>
        </CardDescription>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={organizer.photoURL ?? ""} />
            <AvatarFallback>
              {organizer.name ? organizer.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {organizer.name ?? "..."}
            </span>
            <span className="text-xs text-muted-foreground">{t("tournament.organizer")}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
