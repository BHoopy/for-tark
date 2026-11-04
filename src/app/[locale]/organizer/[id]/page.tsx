
"use client";
import React from "react";
import { UserNav } from "@/components/navbar/user-nav";
import { useLocale, useTranslations } from "next-intl";
import PulseLoader from "@/components/ui/pulse-loader";
import ChartPreview from "@/components/charts/chart-preview";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useUserTournaments } from "@/backend-calls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "next/navigation";
import { useUserById } from "@/backend-calls/users/use-user-by-id";
import { useUser } from "@/hooks/use-user";
import {
  Mail,
  Phone,
  MessageSquare,
  Twitter,
  Facebook,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function OrganizerPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { id } = useParams();
  const organizerId = Array.isArray(id) ? id[0] : id;
  const { user: currentUser } = useUser();

  const {
    data: organizer,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useUserById(organizerId);

  const {
    data: tournaments,
    isLoading: isLoadingTournaments,
    isError: isErrorTournaments,
  } = useUserTournaments({
    userId: organizerId,
  });

  if (isLoadingUser || !organizer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <PulseLoader />
      </div>
    );
  }

  if (isErrorUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Organizer not found.</p>
      </div>
    );
  }

  const linkPath = currentUser
    ? `/${locale}/user/tournament/`
    : `/${locale}/show/`;

  const socialLinks = [
    {
      handle: organizer.email,
      icon: Mail,
      label: "Email",
      href: `mailto:${organizer.email}`,
    },
    {
      handle: organizer.phone,
      icon: Phone,
      label: "Phone",
      href: `tel:${organizer.phone}`,
    },
    {
      handle: organizer.whatsapp,
      icon: MessageSquare,
      label: "WhatsApp",
      href: `https://wa.me/${organizer.whatsapp}`,
    },
    {
      handle: organizer.x,
      icon: Twitter,
      label: "X",
      href: `https://x.com/${organizer.x}`,
    },
    {
      handle: organizer.facebook,
      icon: Facebook,
      label: "Facebook",
      href: `https://facebook.com/${organizer.facebook}`,
    },
    {
      handle: organizer.discord,
      icon: Disc,
      label: "Discord",
      href: `https://discord.com/users/${organizer.discord}`,
    },
  ].filter((link) => link.handle);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <UserNav
        title={organizer.displayName ?? organizer.email ?? ""}
        isBack={true}
        backPath={`/${locale}/`}
      />
      <main className="flex flex-1 flex-col items-center gap-8 p-6">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={organizer?.photoURL ?? ""} alt="user avatar" />
            <AvatarFallback>
              {organizer?.displayName?.charAt(0) ??
                organizer?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {organizer.displayName || organizer.email}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("organizer.tournaments-by")}{" "}
              {organizer.displayName || organizer.email}
            </p>
          </div>
          {socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <TooltipProvider>
                {socialLinks.map((social) => (
                  <Tooltip key={social.label}>
                    <TooltipTrigger asChild>
                      <Button asChild variant="outline" size="icon">
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <social.icon className="h-5 w-5" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{social.handle}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>

        {isLoadingTournaments ? (
          <PulseLoader />
        ) : isErrorTournaments ? (
          <p className="text-red-500">Error loading tournaments.</p>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="w-full max-w-7xl">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <ChartPreview
                  key={tournament.id}
                  tournament={tournament}
                  link={linkPath}
                />
              ))}
            </div>
          </div>
        ) : (
          <p>{t("no.yours")}</p>
        )}
      </main>
      <DonationBanner /><Footer />
    </div>
  );
}
