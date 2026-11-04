import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase/firebase";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { commentsQueryKeys } from "./comments-query-keys";
import { getSql } from "@/lib/neon";

export function useAddComment(tournamentId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  const auth = getAuth(app);

  const addCommentFn = async (text: string) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }
    if (!text.trim()) {
      throw new Error("Comment cannot be empty.");
    }

    const sql = getSql();
    const rows = (await sql`
      INSERT INTO comments (id, tournament_id, text, created_by, author_name, author_photo_url, created_at)
      VALUES (gen_random_uuid()::text, ${tournamentId}, ${text}, ${user.uid}, ${user.displayName || "Anonymous"}, ${user.photoURL}, now())
      RETURNING id, tournament_id, text, created_by, author_name, author_photo_url, created_at
    `) as any[];

    const r = rows[0];
    return {
      id: r.id,
      tournamentId: r.tournament_id,
      text: r.text,
      createdBy: r.created_by,
      authorName: r.author_name,
      authorPhotoURL: r.author_photo_url,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : r.created_at,
    };
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