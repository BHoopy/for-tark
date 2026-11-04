
"use client";
import React from "react";
import { UserNav } from "@/components/navbar/user-nav";
import { useLocale, useTranslations } from "next-intl";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicyPage() {
  const t = useTranslations("pages");
  const locale = useLocale();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <UserNav
        title={t("privacy-policy")}
        isBack={true}
        backPath={`/${locale}/`}
      />
      <main className="container mx-auto flex-1 p-4 py-8 md:p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: {new Date().toLocaleDateString()}
          </p>
          <Separator className="my-6" />
          <div className="space-y-6 text-muted-foreground">
            <p>
              Welcome to PlayChamp (m.playchamp.app and playchamp.app). Your
              privacy is important to us. This Privacy Policy explains how we
              collect, use, and protect your personal information.
            </p>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                1. Information We Collect
              </h2>
              <p>
                We collect the following information when you use our platform:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>
                  <strong>Google Account Information:</strong> When you sign in
                  using Google, we access your basic profile information (name,
                  email, profile picture) with your permission.
                </li>
                <li>
                  <strong>Email Sign-Up:</strong> If you register with your
                  email, we collect your name and email address.
                </li>
                <li>
                  <strong>Tournament Data:</strong> Information related to
                  tournaments you create or join (team names, scores, players,
                  etc.)
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                2. How We Use Your Information
              </h2>
              <p>We use your information to:</p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>Create and manage your account</li>
                <li>
                  Help you organize and participate in eFootball tournaments
                </li>
                <li>Provide customer support</li>
                <li>Improve and maintain our services</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                3. Sharing Your Information
              </h2>
              <p>
                We do not sell or rent your personal information to third
                parties. We may share data with:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>
                  Service providers (e.g., Google for authentication)
                </li>
                <li>Legal authorities if required by law</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                4. Data Security
              </h2>
              <p>
                We take reasonable steps to protect your information using
                secure systems and encryption where applicable.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                5. Your Choices
              </h2>
              <p>You can:</p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>Access and update your account info</li>
                <li>Delete your account by contacting us</li>
                <li>Revoke Google access from your Google account settings</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                6. Children's Privacy
              </h2>
              <p>
                Our service is not intended for users under 13 years of age. We
                do not knowingly collect data from children.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy occasionally. We’ll notify
                users of significant changes.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                8. Contact Us
              </h2>
              <p>
                If you have questions about this policy, contact us at:
                <br />
                📧{" "}
                <a
                  href="mailto:info@playchamp.app"
                  className="underline"
                >
                  info@playchamp.app
                </a>
                <br />
                🌐{" "}
                <a
                  href="https://playchamp.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  https://playchamp.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <DonationBanner /><Footer />
    </div>
  );
}
