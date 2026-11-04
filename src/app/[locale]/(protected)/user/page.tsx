
"use client";
import React from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function UserPage() {
  const locale = useLocale();
  const router = useRouter();

  React.useEffect(() => {
    router.push(`/${locale}/user/tournaments`);
  }, [router, locale]);

  return null;
}
