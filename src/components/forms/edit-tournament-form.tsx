
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import updateTournamentSchema from "@/schema/update-tournament-schema";
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
import { useDeleteTournament, useEditTournament } from "@/backend-calls";
import { useLocale, useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { UpdateTournamentCoverForm } from "./update-tournament-cover-form";
import { Separator } from "../ui/separator";
import { ManageModeratorsForm } from "./manage-moderators-form";

interface EditTournamentFormProps {
  data: tournamentBody;
  setOpenEdit: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EditTournamentForm({
  data,
  setOpenEdit,
}: EditTournamentFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isModeratorDialogOpen, setModeratorDialogOpen] = React.useState(false);

  const editTournamentMutation = useEditTournament({ id: data.id ?? "" });
  const deleteTournamentMutation = useDeleteTournament({
    router,
    closeModal: () => {
      setOpenEdit(false);
      setDeleteDialogOpen(false);
    },
    locale,
  });

  const form = useForm<z.infer<typeof updateTournamentSchema>>({
    resolver: zodResolver(updateTournamentSchema),
    defaultValues: {
      name: data.name,
      description: data.description ?? "",
      rules: data.rules ?? "",
      numberOfTeams: data.numberOfTeams,
      matchType: data.matchType ?? "single_leg",
    },
  });

  async function onSubmit(values: z.infer<typeof updateTournamentSchema>) {
    editTournamentMutation.mutate(values);
    setOpenEdit(false);
  }

  async function handleDelete() {
    if (data.id) {
      deleteTournamentMutation.mutate(data.id);
    }
  }

  return (
    <>
      <Card className="mb-6 border-0 shadow-none">
        <CardHeader className="p-0">
          <CardTitle>{t("forms.tournament.cover-image")}</CardTitle>
          <CardDescription>
            {t("forms.tournament.cover-image-description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <UpdateTournamentCoverForm
            setOpen={setOpenEdit}
            tournamentId={data.id!}
          />
        </CardContent>
      </Card>
      <Separator className="mb-6" />
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.description-title")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("forms.tournament.description-placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.rules-title")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("forms.tournament.rules-placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="matchType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.match-type")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "forms.tournament.match-type-placeholder",
                        )}
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

          {(data.format === "knockout" || data.format === "group_then_knockout") && (
            <div>
              <FormField
                control={form.control}
                name="numberOfTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("forms.tournament.number-of-teams")}
                    </FormLabel>
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
                         {data.format === "group_then_knockout"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardDescription className="mt-2 text-xs">
                {t("forms.tournament.knockout-team-notice")}
              </CardDescription>
            </div>
          )}

          <div className="flex justify-between">
            <Button type="submit">{t("forms.tournament.update")}</Button>

            <Dialog
              open={isModeratorDialogOpen}
              onOpenChange={setModeratorDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="secondary">
                  {t("forms.tournament.manage-moderators")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("forms.tournament.manage-moderators")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("forms.tournament.moderator-description")}
                  </DialogDescription>
                </DialogHeader>
                <ManageModeratorsForm tournament={data} />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="destructive">
                  {t("forms.tournament.delete")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("forms.tournament.delete-title")}
                    {`"${data.name}"?`}
                  </DialogTitle>
                  <DialogDescription>
                    {t("forms.tournament.delete-description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      {t("forms.tournament.cancel")}
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    {t("forms.tournament.confirm-delete")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </>
  );
}
