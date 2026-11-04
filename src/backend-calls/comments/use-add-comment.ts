
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { commentsQueryKeys } from "./comments-query-keys";

export function useAddComment(tournamentId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const auth = getAuth(app);
  const db = getFirestore(app);

  const addCommentFn = async (text: string) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }
    if (!text.trim()) {
      throw new Error("Comment cannot be empty.");
    }

    const commentData = {
      text,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      authorName: user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL,
    };

    const commentsColRef = collection(
      db,
      "tournaments",
      tournamentId,
      "comments",
    );
    return await addDoc(commentsColRef, commentData);
  };

  return useMutation({
    mutationFn: addCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.comments(tournamentId),
      });
      toast({
        title: t("add-comment-success.title"),
        description: t("add-comment-success.description"),
      });
    },
    onError: (error) => {
      toast({
        title: t("add-comment-fail.title"),
        description:
          (error as Error).message || t("add-comment-fail.description"),
        variant: "destructive",
      });
    },
  });
}
