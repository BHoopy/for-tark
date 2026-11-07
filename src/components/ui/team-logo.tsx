import * as React from "react";
import Image from "next/image";
import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamLogo({
  logo,
  alt,
  size = 24,
  className,
}: {
  logo?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!logo) {
    return (
      <CircleDot
        className={cn("text-muted-foreground", className)}
        style={{ width: size, height: size }}
        aria-label={alt}
      />
    );
  }
  return (
    <Image
      src={logo}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={cn("object-contain", className)}
    />
  );
}
