
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { getCookie, setCookie } from "cookies-next";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CommunityVersionBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cookieValue = getCookie("playchamp-community-banner-dismissed");
      if (!cookieValue) {
        setIsVisible(true);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    setCookie("playchamp-community-banner-dismissed", "true", {
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 w-full",
        "bg-background text-foreground border-t border-border",
        "animate-in slide-in-from-bottom-5",
      )}
    >
      <div className="container relative mx-auto max-w-7xl p-3">
        <a
          href="https://playchamp.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-between gap-2 text-center md:flex-row md:text-left"
        >
          <div className="flex-grow">
            <h3 className="text-sm font-semibold">
              Try The Community Version
            </h3>
            <p className="text-xs text-muted-foreground">
              Discover or create tournaments, compete seamlessly, and stay
              connected with opponents through built-in real-time chat.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="mt-2 h-auto flex-shrink-0 px-3 py-1 text-xs md:mt-0 md:text-sm"
          >
            <span>Try It Now</span>
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute right-1 top-1 h-6 w-6 rounded-full text-muted-foreground hover:bg-muted/50"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
