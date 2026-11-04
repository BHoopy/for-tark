
"use client";

import { teamBody, tournamentBody } from "@/types/types";
import { Card, CardContent } from "./card";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "./button";
import { Loader2, Share } from "lucide-react";
import React from "react";
import { toDataURL } from "@/lib/toDataURL";

interface WinnerCardProps {
  winner: teamBody;
  tournament: tournamentBody;
}

export default function WinnerCard({ winner, tournament }: WinnerCardProps) {
  const t = useTranslations("tournament");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleShare = async () => {
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      // Load images
      const bgImage = document.createElement("img");
      const tournamentLogo = document.createElement("img");
      const winnerLogo = document.createElement("img");

      const [bgData, tournamentLogoData, winnerLogoData] = await Promise.all([
        toDataURL("/champ.webp"),
        toDataURL(
          tournament.coverImageUrl || "/favicon/android-chrome-512x512.png",
        ),
        toDataURL(winner.logo || "/Play.png"),
      ]);

      const bgPromise = new Promise((resolve) => {
        bgImage.onload = resolve;
        bgImage.src = bgData;
      });
      const tournamentLogoPromise = new Promise((resolve) => {
        tournamentLogo.onload = resolve;
        tournamentLogo.src = tournamentLogoData;
      });
      const winnerLogoPromise = new Promise((resolve) => {
        winnerLogo.onload = resolve;
        winnerLogo.src = winnerLogoData;
      });

      await Promise.all([bgPromise, tournamentLogoPromise, winnerLogoPromise]);

      canvas.width = bgImage.width;
      canvas.height = bgImage.height;

      // Draw background and overlay
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- Draw Tournament Info ---
      const tournamentLogoSize = 80;
      const tournamentLogoX = (canvas.width - tournamentLogoSize) / 2;
      const tournamentLogoY = 40;
      ctx.drawImage(
        tournamentLogo,
        tournamentLogoX,
        tournamentLogoY,
        tournamentLogoSize,
        tournamentLogoSize,
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        tournament.name,
        canvas.width / 2,
        tournamentLogoY + tournamentLogoSize + 40,
      );

      // --- Champion Title ---
      ctx.fillStyle = "#FFD700"; // Gold color
      ctx.font = "bold 80px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 10;
      const championTitleY = tournamentLogoY + tournamentLogoSize + 140;
      ctx.fillText(`🏆 ${t("champion")} 🏆`, canvas.width / 2, championTitleY);
      ctx.shadowBlur = 0;

      // --- Team Logo ---
      const winnerLogoSize = 250;
      const winnerLogoX = (canvas.width - winnerLogoSize) / 2;
      const winnerLogoY = championTitleY + 60;
      ctx.drawImage(
        winnerLogo,
        winnerLogoX,
        winnerLogoY,
        winnerLogoSize,
        winnerLogoSize,
      );

      // --- Team Name ---
      ctx.fillStyle = "white";
      ctx.font = "bold 60px sans-serif";
      ctx.fillText(
        winner.name,
        canvas.width / 2,
        winnerLogoY + winnerLogoSize + 80,
      );

      // --- Roster ---
      if (winner.roster && winner.roster.length > 0) {
        ctx.font = "30px sans-serif";
        const rosterYStart = winnerLogoY + winnerLogoSize + 150;
        winner.roster.forEach((player, index) => {
          ctx.fillText(player, canvas.width / 2, rosterYStart + index * 40);
        });
      }

      // --- Trigger download ---
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }
        const fileName = `${winner.name}-champions.png`;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setIsExporting(false);
      }, "image/png");
    } catch (error) {
      console.error("Failed to generate champion image:", error);
      setIsExporting(false);
    }
  };

  return (
    <Card
      className="relative mb-8 bg-cover bg-center"
      style={{ backgroundImage: "url(/champ.webp)" }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <CardContent className="relative flex flex-col items-center justify-center gap-4 p-6">
        <h4 className="text-xl font-bold tracking-wider text-amber-400">
          🏆 {t("champion")} 🏆
        </h4>
        <Image
          src={winner.logo ?? "/Play.png"}
          alt={winner.name}
          width={96}
          height={96}
          className="h-24 w-24 object-contain"
        />
        <p className="text-2xl font-extrabold text-white">{winner.name}</p>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="absolute right-2 top-2 h-auto rounded-full p-1 text-white hover:bg-white/20"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
