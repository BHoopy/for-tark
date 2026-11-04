
"use client";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import PulseLoader from "../ui/pulse-loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <PulseLoader />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
}
