
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import PulseLoader from "@/components/ui/pulse-loader";
import { UserNav } from "@/components/navbar/user-nav";
import { toast } from "@/hooks/use-toast";

const passwordResetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function ActionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const auth = getAuth(app);

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (mode === "resetPassword" && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((verifiedEmail) => {
          setEmail(verifiedEmail);
          setLoading(false);
        })
        .catch((err) => {
          setError(
            "Invalid or expired password reset link. Please try again.",
          );
          setLoading(false);
        });
    } else {
      setError("Invalid action link.");
      setLoading(false);
    }
  }, [mode, oobCode, auth]);

  const onSubmit = async (data: PasswordResetFormValues) => {
    if (!oobCode) return;
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      router.push(`/${locale}/login`);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center">
          <PulseLoader />
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-destructive">{error}</p>;
    }

    if (mode === "resetPassword" && email) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter a new password for {email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Reset Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <UserNav title={"Password Reset"} isBack backPath={`/${locale}/login`} />
      <div className="container flex flex-1 items-center justify-center">
        <div className="w-full max-w-lg">{renderContent()}</div>
      </div>
    </div>
  );
}
