"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import loginSchema from "@/schema/login-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "../ui/separator";
import { notifyAuthChange } from "@/lib/auth-client";

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Invalid email or password."),
        );
      }

      notifyAuthChange();
      toast({
        title: t("toast.login-success.title"),
        description: t("toast.login-success.description"),
      });
      router.push(`/${locale}/user`);
    } catch (e: any) {
      toast({
        title: t("toast.login-fail.title"),
        description: e.message || t("toast.login-fail.description"),
        variant: "destructive",
      });
    }
  }

  async function handlePasswordReset() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Please enter your email to reset your password.",
      });
      return;
    }
    toast({
      title: "Password reset is not available yet",
      description: "Please contact support to reset your password.",
    });
  }

  async function handleAnonymousSignIn() {
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not start a guest session."),
        );
      }

      notifyAuthChange();
      toast({
        title: t("toast.login-success.title"),
        description: t("toast.login-success.description"),
      });
      router.push(`/${locale}/user`);
    } catch (e: any) {
      toast({
        title: t("toast.login-fail.title"),
        description: e.message || t("toast.login-fail.description"),
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("navbar.login")}</CardTitle>
        <CardDescription>{t("navbar.login-description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.login.email-label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.login.email-placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.login.password-label")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t("forms.login.password-placeholder")}
                      showPasswordLabel={t("forms.login.show-password")}
                      hidePasswordLabel={t("forms.login.hide-password")}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={handlePasswordReset}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("navbar.login-email")}
            </Button>
          </form>
        </Form>
        <Separator className="my-4" />
        <div className="space-y-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAnonymousSignIn}
          >
            Continue as Guest
          </Button>
          <div className="text-center text-sm">
            {t("navbar.no-account")}{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => router.push(`/${locale}/signup`)}
            >
              {t("navbar.sign-up")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
