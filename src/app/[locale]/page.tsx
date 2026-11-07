"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PulseLoader from "@/components/ui/pulse-loader";
import { UserNav } from "@/components/navbar/user-nav";
import { usePaginatedTournaments } from "@/backend-calls";
import { useLocale, useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ChartPreview from "@/components/charts/chart-preview";
import { useUser } from "@/hooks/use-user";

export default function Home() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, isError } = usePaginatedTournaments({
    page: page,
    pageLimit: 9,
  });
  const t = useTranslations();
  const { user } = useUser();
  const locale = useLocale();

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data || newPage <= data.totalPages)) {
      setPage(newPage);
    }
  };

  const filteredTournaments = useMemo(() => {
    if (!data?.tournaments) return [];
    return data.tournaments.filter((tournament) =>
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data?.tournaments, searchQuery]);

  const linkPath = user ? `/${locale}/user/tournament/` : `/${locale}/show/`;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <UserNav title={"navbar.welcome"} avatar={true} />
        <div className="container flex justify-center p-2">
          <div className="w-full max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("tournament.search-pool")}
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-5xl">
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center pt-8">
                <PulseLoader />
              </div>
            ) : isError ? (
              <div className="pt-8 text-center text-red-500">
                Error loading tournaments. Please try again later.
              </div>
            ) : (
              <>
                {filteredTournaments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTournaments.map((tournament) => (
                      <ChartPreview
                        key={tournament.id}
                        tournament={tournament}
                        link={linkPath}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 pt-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                      {searchQuery ? "No results found" : t("no.yet")}
                    </h1>
                  </div>
                )}
                {data && data.totalPages > 1 && !searchQuery && (
                  <Pagination className="pt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: data.totalPages }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => handlePageChange(i + 1)}
                            isActive={page === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === data.totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <DonationBanner />
      <Footer />
    </div>
  );
}
