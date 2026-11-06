import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import AppProvider from "@/providers/app-provider";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = localFont({
  src: "../../../styles/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../../styles/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PlayChamp Simplified",
  description: "Create and manage your tournaments with ease.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        id="root"
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-P6ZF7BXLME"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-P6ZF7BXLME');
          `}
        </Script>
        <AppProvider>{children}</AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
