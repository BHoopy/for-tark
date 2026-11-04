
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentBody } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { tournamentsQueryKeys } from "@/backend-calls";
import { useTranslations } from "next-intl";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  arrayUnion,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

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
  const db = getFirestore(app);

  async function createTournamentFn(
    tournament: Omit<tournamentBody, "teams" | "fixtures">,
  ) {
    if (!user) throw new Error("User not authenticated.");

    closeModal(); // Close modal immediately

    const tournamentToCreate = {
      ...tournament,
      numberOfTeams: tournament.numberOfTeams || null, // Ensure it's not undefined
      status: "draft",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      coverImageUrl:
        "https://res.cloudinary.com/dwoklp9vo/image/upload/v1757560924/Screenshot_2025-09-08_152618_m86jwu.avif",
    };

    const docRef = await addDoc(
      collection(db, "tournaments"),
      tournamentToCreate,
    );

    const userDocRef = doc(db, "users", user.uid);
    // Add the user document if it doesn't exist, or update it.
    await setDoc(
      userDocRef,
      {
        tournamentsId: arrayUnion(docRef.id),
      },
      { merge: true },
    );
    router.push(`/${locale}/user/tournament/` + docRef.id);

    return { id: docRef.id };
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
