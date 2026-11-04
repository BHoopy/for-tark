"use client";
import { ToasterProvider } from "@/providers/toaster-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TanstackQueryProvider } from "@/providers/tanstack-query-provider";
import { ReactNode } from "react";
import { IntlProvider } from "@/providers/intl-provider";

export default function AppProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <IntlProvider>
      <TanstackQueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <ToasterProvider />
      </TanstackQueryProvider>
    </IntlProvider>
  );
}
