
"use client";
import React from "react";
import { UserNav } from "@/components/navbar/user-nav";
import { useUser } from "@/hooks/use-user";
import { useLocale, useTranslations } from "next-intl";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { UpdateProfileForm } from "@/components/forms/update-profile-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditProfileForm } from "@/components/forms/edit-profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserById } from "@/backend-calls";
import {
  Mail,
  Phone,
  MessageSquare,
  Twitter,
  Facebook,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { UpdateCoverImageForm } from "@/components/forms/update-cover-image-form";

export default function ProfilePage() {
  const { user } = useUser();
  const t = useTranslations();
  const locale = useLocale();
  const { data: userProfile } = useUserById(user?.uid ?? "");

  const socialLinks = [
    {
      handle: userProfile?.email,
      icon: Mail,
      label: "Email",
      href: `mailto:${userProfile?.email}`,
    },
    {
      handle: userProfile?.phone,
      icon: Phone,
      label: "Phone",
      href: `tel:${userProfile?.phone}`,
    },
    {
      handle: userProfile?.whatsapp,
      icon: MessageSquare,
      label: "WhatsApp",
      href: `https://wa.me/${userProfile?.whatsapp}`,
    },
    {
      handle: userProfile?.x,
      icon: Twitter,
      label: "X",
      href: `https://x.com/${userProfile?.x}`,
    },
    {
      handle: userProfile?.facebook,
      icon: Facebook,
      label: "Facebook",
      href: `https://facebook.com/${userProfile?.facebook}`,
    },
    {
      handle: userProfile?.discord,
      icon: Disc,
      label: "Discord",
      href: `https://discord.com/users/${userProfile?.discord}`,
    },
  ].filter((link) => link.handle);

  return (
    <div className="flex min-h-screen w-full flex-col bg-light-profile dark:bg-dark-profile">
      <UserNav
        title={t("pages.profile")}
        isBack={true}
        backPath={`/${locale}/user/tournaments`}
        avatar={true}
      />
      <main className="flex-1 bg-transparent">
        <div className="relative h-48 w-full md:h-64">
          {userProfile?.coverImageURL ? (
            <Image
              src={userProfile.coverImageURL}
              alt="Cover image"
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary to-primary/80" />
          )}

          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={user?.photoURL ?? ""} alt="user avatar" />
              <AvatarFallback>
                {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="mt-20 text-center">
          <h1 className="text-3xl font-bold">{userProfile?.displayName}</h1>
          <p className="text-muted-foreground">{userProfile?.email}</p>
        </div>

        <div className="container mx-auto mt-8 max-w-6xl p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* User Info and Socials */}
            <div className="space-y-6 md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t("forms.profile.social-handles")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <TooltipProvider>
                        {socialLinks.map((social) => (
                          <Tooltip key={social.label}>
                            <TooltipTrigger asChild>
                              <Button asChild variant="outline" size="icon">
                                <a
                                  href={social.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-10 w-10"
                                >
                                  <social.icon className="h-5 w-5" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{social.handle}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No social links provided.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Edit Forms */}
            <div className="md:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">
                    {t("forms.profile.edit-title")}
                  </TabsTrigger>
                  <TabsTrigger value="picture">
                    {t("forms.profile.picture")}
                  </TabsTrigger>
                  <TabsTrigger value="cover">
                    {t("forms.profile.cover-image")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("forms.profile.edit-title")}
                      </CardTitle>
                      <CardDescription>
                        {t("forms.profile.edit-description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EditProfileForm />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="picture">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("forms.profile.picture")}</CardTitle>
                      <CardDescription>
                        {t("forms.profile.picture-description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UpdateProfileForm setOpen={() => {}} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="cover">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("forms.profile.cover-image")}
                      </CardTitle>
                      <CardDescription>
                        Update your cover image.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UpdateCoverImageForm setOpen={() => {}} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <DonationBanner /><Footer />
    </div>
  );
}
