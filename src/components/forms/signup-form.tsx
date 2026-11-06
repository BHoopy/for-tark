"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import signupSchema from "@/schema/signup-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not create your account."),
        );
      }

      notifyAuthChange();
      toast({
        title: t("toast.signup-success.title"),
        description: t("toast.signup-success.description"),
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
        <CardTitle>{t("navbar.sign-up")}</CardTitle>
        <CardDescription>{t("navbar.signup-description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.login.username-label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.login.username-placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Input
                      type="password"
                      placeholder={t("forms.login.password-placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("navbar.signup-email")}
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
            {t("navbar.has-account")}{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => router.push(`/${locale}/login`)}
            >
              {t("navbar.login")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
