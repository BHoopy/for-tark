import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { commentsQueryKeys } from "./comments-query-keys";
import { addComment } from "@/lib/server-actions/comments";

export function useAddComment(tournamentId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");

  const addCommentFn = async (text: string) => {
    return addComment(tournamentId, text);
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
