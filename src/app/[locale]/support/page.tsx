"use client";
import { UserNav } from "@/components/navbar/user-nav";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { useLocale, useTranslations } from "next-intl";

export default function SupportPage() {
  const t = useTranslations("pages");
  const locale = useLocale();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <UserNav
        title={t("support")}
        isBack={true}
        backPath={`/${locale}/`}
      />
      <main className="container mx-auto flex flex-1 items-center justify-center p-4 py-8 md:p-8">
        <div className="w-full max-w-4xl">
          <div className="aspect-w-1 aspect-h-1 md:aspect-w-2 md:aspect-h-1">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScLZVVtF-fUjm4ZayPbBcRPPfy45wX6yt0arXPnwXniVl9gDw/viewform?embedded=true"
              width="100%"
              height="816"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="h-[816px]"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </main>
      <DonationBanner /><Footer />
    </div>
  );
}
