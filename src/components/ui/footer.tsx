import { Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// HIDDEN: Play Champ footer is disabled.
// To restore it later, remove the early `return null;` below
// (and re-add <DonationBanner /> usage in the pages where needed).
export default function Footer() {
  return null; // <- remove this line to re-enable the footer

  return (
    <footer className="row-start-3 flex h-fit flex-wrap items-center justify-center gap-2 p-4">
      <Button
        className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground md:text-sm sm:px-4 sm:py-2"
        variant="link"
        asChild
      >
        <a href="https://playchamp.app" target="_blank" rel="noopener noreferrer">
          <Image src="/Play.png" alt="Play Champ Logo" width={20} height={20} />
          <span className="font-semibold">Play Champ</span>
          <span>(playchamp.app)</span>
          <Copyright width={16} height={16} />
          <span>2025</span>
        </a>
      </Button>
    </footer>
  );
}
