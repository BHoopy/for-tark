"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { BookLock, LifeBuoy, LogOut, Swords, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLocale, useTranslations } from "next-intl";
import { notifyAuthChange } from "@/lib/auth-client";
import type { AuthUser } from "@/types/auth";

export function UserToggle({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not sign out.");
      }
      notifyAuthChange();
      toast({
        title: t("toast.logout-success.title"),
        description: t("toast.logout-success.description"),
      });
      router.push(`/${locale}/`);
    } catch (e: any) {
      toast({
        title: t("toast.logout-fail.title") + e.message,
        description: t("toast.login-fail.description"),
        variant: "destructive",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-4 w-4 rounded-full sm:h-8 sm:w-8 md:h-10 md:w-10"
        >
          <Avatar>
            <AvatarImage
              src={
                user?.photoURL ??
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNpcmNsZS11c2VyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48cGF0aCBkPSJNNyAyMC42NjJWMTlhMiAyIDAgMCAxIDItMmg2YTIgMiAwIDAgMSAyIDJ2MS42NjIiLz48L3N2Zz4="
              }
              alt={user?.displayName ?? "UN"}
            />
            <AvatarFallback>
              {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mt-2 w-46 sm:w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-bold leading-none">
              {user?.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${locale}/user/tournaments`)}>
          <Swords className="mr-2 size-3 md:size-4" />
          <span className="text-xs md:text-sm">{t("pages.my-tournaments")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/user/profile`)}>
          <UserIcon className="mr-2 size-3 md:size-4" />
          <span className="text-xs md:text-sm">{t("pages.profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${locale}/support`)}>
          <LifeBuoy className="mr-2 size-3 md:size-4" />
          <span className="text-xs md:text-sm">{t("pages.support")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/${locale}/privacy-policy`)}
        >
          <BookLock className="mr-2 size-3 md:size-4" />
          <span className="text-xs md:text-sm">
            {t("pages.privacy-policy")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 size-3 md:size-4" />
          <span className="text-xs md:text-sm">{t("navbar.log-out")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
