import { cn } from "@/lib/utils";

export const TrophyIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-trophy", className)}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M8 21v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
    <path d="M12 5.09V12" />
    <path d="M6 12H2" />
    <path d="M18 12h4" />
    <path d="M12 12a6 6 0 0 0-6-6" />
    <path d="M12 12a6 6 0 0 1 6-6" />
  </svg>
);
