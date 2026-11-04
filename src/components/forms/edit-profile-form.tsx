
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { toast } from "@/hooks/use-toast";
import { getAuth, updateProfile } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserById } from "@/backend-calls/users/use-user-by-id";

const profileSchema = z.object({
  displayName: z.string().max(50).optional(),
  whatsapp: z.string().optional(),
  x: z.string().optional(),
  facebook: z.string().optional(),
  phone: z.string().optional(),
  discord: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function EditProfileForm() {
  const t = useTranslations();
  const { user } = useUser();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const { data: userProfile, refetch } = useUserById(user?.uid ?? "");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      whatsapp: "",
      x: "",
      facebook: "",
      phone: "",
      discord: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName ?? user?.displayName ?? "",
        whatsapp: userProfile.whatsapp ?? "",
        x: userProfile.x ?? "",
        facebook: userProfile.facebook ?? "",
        phone: userProfile.phone ?? "",
        discord: userProfile.discord ?? "",
      });
    } else if (user) {
      form.reset({
        displayName: user.displayName ?? "",
      });
    }
  }, [userProfile, user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      // Update Firebase Auth profile
      if (data.displayName && data.displayName !== user.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL,
          displayName: data.displayName,
          whatsapp: data.whatsapp,
          x: data.x,
          facebook: data.facebook,
          phone: data.phone,
          discord: data.discord,
        },
        { merge: true },
      );
      
      refetch();

      toast({
        title: t("toast.profile-update-success.title"),
        description: t("toast.profile-update-success.description"),
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: t("toast.profile-update-fail.title"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  const socialFields = [
    {
      name: "whatsapp",
      label: t("forms.profile.whatsapp"),
      prefix: "https://wa.me/",
    },
    { name: "x", label: t("forms.profile.x"), prefix: "https://x.com/" },
    {
      name: "facebook",
      label: t("forms.profile.facebook"),
      prefix: "https://facebook.com/",
    },
    {
      name: "discord",
      label: t("forms.profile.discord"),
      prefix: "https://discord.com/users/",
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.profile.name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.profile.phone")}</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {socialFields.map((social) => (
          <FormField
            key={social.name}
            control={form.control}
            name={social.name as "whatsapp" | "x" | "facebook" | "discord"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{social.label}</FormLabel>
                <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {social.prefix}
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t("forms.profile.update")}
        </Button>
      </form>
    </Form>
  );
}
