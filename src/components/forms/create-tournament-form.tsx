
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import createTournamentSchema from "@/schema/create-tournament-schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { Button } from "@/components/ui/button";
import { tournamentBody } from "@/types/types";
import { useCreateTournament } from "@/backend-calls";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTournamentFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CreateTournamentForm({ setOpen }: CreateTournamentFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const createTournamentMutation = useCreateTournament({
    router: router,
    closeModal: () => setOpen(false),
    locale: locale,
  });
  const form = useForm<z.infer<typeof createTournamentSchema>>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      matchType: "single_leg",
    },
  });

  const selectedFormat = form.watch("format");

  function onSubmit(values: z.infer<typeof createTournamentSchema>) {
    const newTournament: Omit<
      tournamentBody,
      | "teams"
      | "createdBy"
      | "createdAt"
      | "fixtures"
      | "description"
      | "rules"
      | "id"
    > = {
      name: values.name,
      format: values.format,
      matchType: values.matchType,
      status: "draft",
      numberOfTeams: values.numberOfTeams,
    };
    createTournamentMutation.mutate(newTournament as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.tournament.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("forms.tournament.name-description")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.tournament.format")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("forms.tournament.format-placeholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="round_robin">
                    {t("forms.tournament.round_robin")}
                  </SelectItem>
                  <SelectItem value="knockout">
                    {t("forms.tournament.knockout")}
                  </SelectItem>
                  <SelectItem value="group_then_knockout">
                    {t("forms.tournament.group_then_knockout")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(selectedFormat === "knockout" ||
          selectedFormat === "group_then_knockout") && (
          <FormField
            control={form.control}
            name="numberOfTeams"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.number-of-teams")}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "forms.tournament.number-of-teams-placeholder",
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedFormat === "group_then_knockout"
                      ? [8, 16, 32, 48, 64].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}
                          </SelectItem>
                        ))
                      : [4, 8, 16, 32, 64, 128].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("forms.tournament.knockout-team-notice")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="matchType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("forms.tournament.match-type")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("forms.tournament.match-type-placeholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="single_leg">
                    {t("forms.tournament.single_leg")}
                  </SelectItem>
                  <SelectItem value="two_leg">
                    {t("forms.tournament.two_leg")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{t("forms.tournament.create")}</Button>
      </form>
    </Form>
  );
}
