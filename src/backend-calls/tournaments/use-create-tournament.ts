import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { tournamentsQueryKeys } from "@/backend-calls";
import { useTranslations } from "next-intl";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import { getSql } from "@/lib/neon";

interface Props {
  router: AppRouterInstance;
  closeModal: () => void;
  locale: string;
}

export function useCreateTournament({ router, closeModal, locale }: Props) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const auth = getAuth(app);
  const user = auth.currentUser;

  async function createTournamentFn(
    tournament: Omit<tournamentBody, "teams" | "fixtures">,
  ) {
    if (!user) throw new Error("User not authenticated.");

    const sql = getSql();

    const tournamentToCreate = {
      ...tournament,
      numberOfTeams: tournament.numberOfTeams || null,
      status: "draft",
      createdBy: user.uid,
      coverImageUrl:
        "https://res.cloudinary.com/dwoklp9vo/image/upload/v1757560924/Screenshot_2025-09-08_152618_m86jwu.avif",
    };

    const rows = (await sql`
      INSERT INTO tournaments (
        id, name, description, rules, format, match_type, status,
        created_by, cover_image_url, number_of_teams, moderators
      ) VALUES (
        gen_random_uuid()::text,
        ${tournamentToCreate.name},
        ${tournamentToCreate.description ?? null},
        ${tournamentToCreate.rules ?? null},
        ${tournamentToCreate.format},
        ${tournamentToCreate.matchType ?? null},
        ${tournamentToCreate.status},
        ${tournamentToCreate.createdBy},
        ${tournamentToCreate.coverImageUrl},
        ${tournamentToCreate.numberOfTeams},
        ${tournamentToCreate.moderators ?? []}
      )
      RETURNING id
    `) as any[];

    return { id: rows[0].id };
  }

  return useMutation({
    mutationFn: createTournamentFn,
    onSuccess: (data) => {
      toast({
        title: t("toast.create-tournament-success.title"),
        description: t("toast.create-tournament-success.description"),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.userTournaments(),
      });
      queryClient.invalidateQueries({
        queryKey: tournamentsQueryKeys.pagination(1),
      });
      closeModal();
      router.push(`/${locale}/user/tournament/` + data.id);
    },
    onError: (error) => {
      const errorDetails =
        (error as any)?.response?.data?.details ||
        (error as any)?.response?.data?.error ||
        (error as any).message;
      toast({
        title: t("toast.create-tournament-fail.title"),
        description:
          errorDetails || t("toast.create-tournament-fail.description"),
        variant: "destructive",
      });
    },
  });
}