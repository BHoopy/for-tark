
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { Button } from "@/components/ui/button";
import { Fixture, Match, teamBody } from "@/types/types";
import { useUpdateScore } from "@/backend-calls";
import { useTranslations } from "next-intl";
import { Separator } from "../ui/separator";

const updateScoreSchema = z.object({
  score1: z.coerce.number().min(0).optional(),
  score2: z.coerce.number().min(0).optional(),
  score1_leg1: z.coerce.number().min(0).optional(),
  score2_leg1: z.coerce.number().min(0).optional(),
  score1_leg2: z.coerce.number().min(0).optional(),
  score2_leg2: z.coerce.number().min(0).optional(),
});

interface UpdateScoreFormProps {
  fixture?: Fixture; // For Round Robin
  match?: Match & { team1?: teamBody; team2?: teamBody }; // For Knockout
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tournamentId: string;
  matchType?: "single_leg" | "two_leg";
  isFinal?: boolean;
}

export function UpdateScoreForm({
  fixture,
  match,
  setOpen,
  tournamentId,
  matchType,
  isFinal = false,
}: UpdateScoreFormProps) {
  const t = useTranslations();

  const effectiveMatchType = isFinal ? "single_leg" : matchType;

  const updateScoreMutation = useUpdateScore({
    tournamentId: tournamentId,
    matchType: effectiveMatchType,
  });

  const isKnockout = !!match;
  const team1Name = isKnockout ? match.team1?.name : fixture?.team1.name;
  const team2Name = isKnockout ? match.team2?.name : fixture?.team2?.name;

  const form = useForm<z.infer<typeof updateScoreSchema>>({
    resolver: zodResolver(updateScoreSchema),
    defaultValues: isKnockout
      ? {
          score1_leg1: match.score1_leg1 ?? 0,
          score2_leg1: match.score2_leg1 ?? 0,
          score1_leg2: match.score1_leg2 ?? 0,
          score2_leg2: match.score2_leg2 ?? 0,
        }
      : {
          score1: fixture?.score1 ?? 0,
          score2: fixture?.score2 ?? 0,
        },
  });

  function onSubmit(values: z.infer<typeof updateScoreSchema>) {
    const payload = isKnockout
      ? {
          match: match!,
          newScores: {
            score1_leg1: values.score1_leg1 ?? 0,
            score2_leg1: values.score2_leg1 ?? 0,
            score1_leg2: effectiveMatchType === 'two_leg' ? values.score1_leg2 ?? 0 : null,
            score2_leg2: effectiveMatchType === 'two_leg' ? values.score2_leg2 ?? 0 : null,
          },
        }
      : {
          fixture: fixture!,
          newScores: {
            score1: values.score1 ?? 0,
            score2: values.score2 ?? 0,
          },
        };

    // @ts-ignore
    updateScoreMutation.mutate(payload);
    setOpen(false);
  }

  const renderKnockoutForm = () => (
    <>
      <h3 className="text-lg font-semibold">
        {effectiveMatchType === "two_leg"
          ? t("forms.score.leg1")
          : t("forms.score.final-score")}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="score1_leg1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{team1Name}</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="score2_leg1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{team2Name}</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {effectiveMatchType === "two_leg" && (
        <>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold">{t("forms.score.leg2")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="score1_leg2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{team1Name}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="score2_leg2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{team2Name}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </>
  );

  const renderRoundRobinForm = () => (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="score1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{team1Name}</FormLabel>
            <FormControl>
              <Input type="number" min="0" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="score2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{team2Name}</FormLabel>
            <FormControl>
              <Input type="number" min="0" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isKnockout ? renderKnockoutForm() : renderRoundRobinForm()}
        <Button type="submit">{t("forms.score.submit")}</Button>
      </form>
    </Form>
  );
}
