
"use client";

import { useAddComment, useFetchComments } from "@/backend-calls";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import PulseLoader from "./pulse-loader";
import { Textarea } from "./textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "./form";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export function CommentSection({ tournamentId }: { tournamentId: string }) {
  const { user } = useUser();
  const t = useTranslations("forms.comment");
  const {
    data: comments,
    isLoading,
    isError,
  } = useFetchComments(tournamentId);

  const addCommentMutation = useAddComment(tournamentId);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = (data: CommentFormValues) => {
    addCommentMutation.mutate(data.text, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder={t("placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="w-full sm:w-auto"
              >
                {addCommentMutation.isPending ? t("submitting") : t("submit")}
              </Button>
            </form>
          </Form>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center">
              <PulseLoader />
            </div>
          ) : isError ? (
            <p className="text-center text-destructive">
              {t("error-loading")}
            </p>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={comment.authorPhotoURL ?? ""} />
                  <AvatarFallback>
                    {comment.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">{t("none")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
