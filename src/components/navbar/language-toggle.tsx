
"use client";
import * as React from "react";
import { Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const FranceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 3 2"
    className="h-full w-full"
  >
    <path fill="#002395" d="M0 0h1v2H0z" />
    <path fill="#fff" d="M1 0h1v2H1z" />
    <path fill="#ED2939" d="M2 0h1v2H2z" />
  </svg>
);

const UKIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 30"
    className="h-full w-full"
  >
    <clipPath id="t">
      <path d="M0 0v30h60V0z" />
    </clipPath>
    <path d="M0 0v30h60V0z" fill="#00247d" />
    <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
    <path
      d="M0 0l60 30m0-30L0 30"
      clipPath="url(#t)"
      stroke="#cf142b"
      strokeWidth="4"
    />
    <path
      d="M30 0v30M0 15h60"
      stroke="#fff"
      strokeWidth="10"
      strokeDasharray="30 0"
    />
    <path d="M30 0v30M0 15h60" stroke="#cf142b" strokeWidth="6" />
  </svg>
);

export function LanguageToggle() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  function ReturnLanguageIcon(locale: string) {
    switch (locale) {
      case "fr":
        return (
          <div className="h-5 w-5 overflow-hidden rounded-full">
            <FranceIcon />
          </div>
        );
      case "en":
        return (
          <div className="h-5 w-5 overflow-hidden rounded-full">
            <UKIcon />
          </div>
        );
      default:
        return <Earth />;
    }
  }

  const changeLocale = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const updatedPath = `/${newLocale}${currentPath.replace(/^\/(en|fr)/, "")}`;
    router.push(updatedPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="delay-250 flex h-9 w-9 items-center justify-center rounded-full transition ease-in-out hover:scale-110"
        >
          {ReturnLanguageIcon(locale)}
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-4" onClick={() => changeLocale("fr")}>
          <div className="h-4 w-4 overflow-hidden rounded-sm">
            <FranceIcon />
          </div>
          {t("language.french")}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-4" onClick={() => changeLocale("en")}>
          <div className="h-4 w-4 overflow-hidden rounded-sm">
            <UKIcon />
          </div>
          {t("language.english")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
