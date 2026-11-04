
"use client";
import { LoginForm } from "@/components/forms/login-form";
import { UserNav } from "@/components/navbar/user-nav";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations();
  return (
    <div className="flex h-screen w-full flex-col">
      <UserNav title={"navbar.welcome-login"} />
      <div className="container flex flex-1 items-center justify-center">
        <div className="w-full max-w-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
