
"use client";
import React, { Suspense } from "react";
import { UserNav } from "@/components/navbar/user-nav";
import { useUser } from "@/hooks/use-user";
import { useLocale, useTranslations } from "next-intl";
import PulseLoader from "@/components/ui/pulse-loader";
import ChartPreview from "@/components/charts/chart-preview";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateTournamentForm } from "@/components/forms/create-tournament-form";
import { useUserTournaments } from "@/backend-calls";

function TournamentsList() {
  const { user } = useUser();
  const t = useTranslations();
  const locale = useLocale();

  const { data: tournaments } = useUserTournaments({ userId: user?.uid });

  if (tournaments && tournaments.length > 0) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <ChartPreview
            key={tournament.id}
            tournament={tournament}
            link={`/${locale}/user/tournament/`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-semibold">{t("no.yours")}</h2>
      <p className="mt-2 text-muted-foreground">
        {t("tournament.get-started")}
      </p>
      <DialogTrigger asChild>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          {t("tournament.create-new")}
        </Button>
      </DialogTrigger>
    </div>
  );
}

export default function UserTournamentsPage() {
  const t = useTranslations();
  const [openCreate, setOpenCreate] = React.useState(false);

  return (
    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
      <div className="flex min-h-screen w-full flex-col">
        <UserNav title={"pages.my-tournaments"} isBack={false} avatar={true}>
          <DialogTrigger asChild>
            <Button>{t("tournament.create-new")}</Button>
          </DialogTrigger>
        </UserNav>
        <main className="container mx-auto flex-1 px-4 py-8 md:px-6">
          <Suspense
            fallback={
              <div className="flex h-full flex-1 items-center justify-center">
                <PulseLoader />
              </div>
            }
          >
            <TournamentsList />
          </Suspense>
        </main>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("tournament.add")}</DialogTitle>
            <DialogDescription>
              {t("tournament.add-description")}
            </DialogDescription>
          </DialogHeader>
          <CreateTournamentForm setOpen={setOpenCreate} />
        </DialogContent>
        <DonationBanner /><Footer />
      </div>
    </Dialog>
  );
}
