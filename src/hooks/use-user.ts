"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT } from "@/lib/auth-client";
import type { AuthUser } from "@/types/auth";
import { useEffect } from "react";

async function fetchSession(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading: loading, refetch } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSession,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  useEffect(() => {
    const handleAuthChange = () => {
      refresh();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [refresh]);

  return { user, loading, refresh };
}
