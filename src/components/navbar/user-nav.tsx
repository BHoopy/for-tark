
import { UserToggle } from "@/components/navbar/user-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/navbar/theme-toggle";
import { ChevronLeft, Heart, Home, LogOut, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/navbar/language-toggle";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { MenuIcon } from "@/components/ui/menu-icon";
import { Swords } from "lucide-react";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface UserNavProps {
  title: string;
  isBack?: boolean;
  backPath?: string;
  avatar?: boolean;
  children?: React.ReactNode;
  username?: string;
}

export function UserNav({
  title,
  isBack = false,
  backPath,
  avatar = false,
  username,
  children,
}: UserNavProps): JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const auth = getAuth(app);
  const [user, setUser] = React.useState(auth.currentUser);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();

    try {
      await signOut(auth);
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

  function handleUserNav() {
    if (loading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (user) {
      return avatar && <UserToggle user={user} />;
    }

    return (
      <Button
        className="delay-250 transition ease-in-out hover:scale-105"
        onClick={() => router.push(`/${locale}/login`)}
      >
        <span>{t("navbar.login")}</span>
      </Button>
    );
  }

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  const renderTitle = () => {
    if (title === "navbar.welcome") {
      return (
        <div className="flex items-center gap-3">
          <Image
            src="/favicon/android-chrome-512x512.png"
            alt="PlayChamp Simplified Logo"
            width={40}
            height={40}
            className="h-8 w-8 md:h-10 md:w-10"
          />
        </div>
      );
    }
    return (
      <h1 className="text-center text-xl font-bold tracking-tight md:text-3xl">
        {t(title)} {username && username}
      </h1>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-start gap-2">
          {isBack ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleBack}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                >
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex h-full flex-col bg-background/80 backdrop-blur-xl"
              >
                <SheetHeader>
                  <SheetTitle>{t("navbar.menu")}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-grow flex-col justify-between">
                  <div className="mt-4 flex flex-col gap-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => router.push(`/${locale}/`)}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      {t("pages.homepage")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() =>
                        router.push(`/${locale}/user/tournaments`)
                      }
                    >
                      <Swords className="mr-2 h-4 w-4" />
                      {t("pages.my-tournaments")}
                    </Button>
                    {user && (
                       <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => router.push(`/${locale}/user/favorites`)}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        {t("pages.my-favorites")}
                      </Button>
                    )}
                    {user && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => router.push(`/${locale}/user/profile`)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {t("pages.profile")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href="https://web.facebook.com/PlaychampApp/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src="/facebook.avif"
                          alt="Facebook Logo"
                          width={16}
                          height={16}
                          className="mr-2 h-4 w-4"
                        />
                        Follow Us
                      </a>
                    </Button>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("theme.span")}
                      </span>
                      <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("language.title")}
                      </span>
                      <LanguageToggle />
                    </div>
                    {user && <Separator />}
                    {user && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("navbar.log-out")}
                      </Button>
                    )}
                  </div>
                  <SheetClose asChild>
                    <Button variant="outline">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t("navbar.go-back")}
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center gap-4">
          {renderTitle()}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {children}
          {handleUserNav()}
        </div>
      </div>
    </header>
  );
}
