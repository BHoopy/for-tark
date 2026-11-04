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
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInAnonymously,
  User,
} from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "../ui/separator";
import { getSql } from "@/lib/neon";

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const auth = getAuth(app);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getOrCreateUserDocument = async (user: User) => {
    const sql = getSql();
    const rows = (await sql`
      SELECT id FROM users WHERE uid = ${user.uid} LIMIT 1
    `) as any[];
    if (!rows || rows.length === 0) {
      await sql`
        INSERT INTO users (id, uid, email, display_name, photo_url)
        VALUES (${user.uid}, ${user.uid}, ${user.email ?? null}, ${user.displayName ?? null}, ${user.photoURL ?? null})
      `;
    }
  };

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      await getOrCreateUserDocument(userCredential.user);
      toast({
        title: t("toast.login-success.title"),
        description: t("toast.login-success.description"),
      });
      router.push(`/${locale}/user`);
    } catch (e: any) {
      toast({
        title: t("toast.login-fail.title") + e.message,
        description: t("toast.login-fail.description"),
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
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error Sending Reset Email",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleAnonymousSignIn() {
    try {
      const userCredential = await signInAnonymously(auth);
      await getOrCreateUserDocument(userCredential.user);
      toast({
        title: t("toast.login-success.title"),
        description: t("toast.login-success.description"),
      });
      router.push(`/${locale}/user`);
    } catch (e: any) {
      toast({
        title: t("toast.login-fail.title") + e.message,
        description: t("toast.login-fail.description"),
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
                    <Input
                      type="password"
                      placeholder={t("forms.login.password-placeholder")}
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
            <Button type="submit" className="w-full">
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