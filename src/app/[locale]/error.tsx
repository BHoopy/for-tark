"use client";

import { useEffect } from "react";

/**
 * Catches render errors in any page under the locale layout (for example an
 * invalid image URL) and shows a recoverable message instead of a blank
 * white screen.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The page could not be displayed. You can try again, or go back to the
        home page.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
        <a
          href="/en"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
