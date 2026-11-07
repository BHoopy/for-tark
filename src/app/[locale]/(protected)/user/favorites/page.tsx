"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { UserNav } from "@/components/navbar/user-nav";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useLocale, useTranslations } from "next-intl";
import PulseLoader from "@/components/ui/pulse-loader";
import ChartPreview from "@/components/charts/chart-preview";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useTournamentsById, useUserById } from "@/backend-calls";
import { tournamentBody } from "@/types/types";

function FavoriteTournament({ tournamentId }: { tournamentId: string }) {
  const locale = useLocale();
  const { data: tournament, isLoading } = useTournamentsById({
    id: tournamentId,
  });

  if (isLoading || !tournament) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border">
        <PulseLoader />
      </div>
    );
  }

  return (
    <ChartPreview
      tournament={tournament}
      link={`/${locale}/user/tournament/`}
    />
  );
}

function FavoritesList() {
  const { user } = useUser();
  const t = useTranslations();
  const locale = useLocale();
  const { data: userProfile, isLoading } = useUserById(user?.uid ?? "");

  const favoriteIds = userProfile?.favoriteTournaments ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <PulseLoader />
      </div>
    );
  }

  if (favoriteIds.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold">{t("no.favorites")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("tournament.add-some-favorites")}
        </p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}`}>{t("pages.browse-tournaments")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favoriteIds.map((id) => (
        <FavoriteTournament key={id} tournamentId={id} />
      ))}
    </div>
  );
}

export default function UserFavoritesPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <UserNav
        title={"pages.my-favorites"}
        isBack={true}
        backPath={`/${locale}`}
        avatar={true}
      />
      <main className="container mx-auto flex-1 px-4 py-8 md:px-6">
        <Suspense
          fallback={
            <div className="flex h-full flex-1 items-center justify-center">
              <PulseLoader />
            </div>
          }
        >
          <FavoritesList />
        </Suspense>
      </main>
      <DonationBanner />
      <Footer />
    </div>
  );
}
