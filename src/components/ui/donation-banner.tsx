import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const DONATION_URL = "https://selar.com/showlove/playchamp";

export default function DonationBanner() {
  return (
    <div className="flex w-full items-center justify-center gap-2 p-3 pt-6">
      <Button
        variant="outline"
        className="flex items-center gap-2 rounded-full border-pink-200 px-5 py-2 text-xs text-pink-600 hover:bg-pink-50 hover:text-pink-700 md:text-sm"
        asChild
      >
        <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
          <Heart className="size-4 fill-pink-500 text-pink-500" />
          <span className="font-medium">Support Play Champ — Show Love</span>
        </a>
      </Button>
    </div>
  );
}
