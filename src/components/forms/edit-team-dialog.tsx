
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { teamBody } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UpdateTeamLogoForm } from "./update-team-logo-form";
import Image from "next/image";
import { Trash, Upload } from "lucide-react";

const editTeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Team name is required"),
  roster: z.string().optional(),
  logo: z.string().optional(),
});

export const EditTeamDialog = ({
  team,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  tournamentId,
  setOpen: setParentOpen,
  onLogoUpdated,
}: {
  team: teamBody;
  onSave: (values: z.infer<typeof editTeamSchema>) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  tournamentId: string;
  setOpen: (open: boolean) => void;
  onLogoUpdated?: () => void;
}) => {
  const t = useTranslations();
  const [openLogoUpload, setOpenLogoUpload] = useState(false);
  const editTeamForm = useForm<z.infer<typeof editTeamSchema>>({
    resolver: zodResolver(editTeamSchema),
    defaultValues: {
      id: team.id ?? "",
      name: team.name,
      roster: Array.isArray(team.roster) ? team.roster.join(", ") : "",
      logo: team.logo || "",
    },
  });

  const handleSave = (values: z.infer<typeof editTeamSchema>) => {
    onSave(values);
    setParentOpen(false);
  };

  const handleDelete = () => {
    onDelete(team.id!);
    setParentOpen(false);
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {t("forms.tournament.edit-team", { name: team.name })}
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-4">
        <Image
          src={team.logo ?? "/Play.png"}
          alt={team.name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-contain"
        />
        <Dialog open={openLogoUpload} onOpenChange={setOpenLogoUpload}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              {t("forms.tournament.change-logo")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("forms.tournament.update-logo")}</DialogTitle>
            </DialogHeader>
            <UpdateTeamLogoForm
              setOpen={setOpenLogoUpload}
              tournamentId={tournamentId}
              team={team}
              onSuccess={onLogoUpdated}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />

      <Form {...editTeamForm}>
        <form
          id="edit-team-form"
          onSubmit={editTeamForm.handleSubmit(handleSave)}
          className="space-y-4"
        >
          <FormField
            control={editTeamForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.team-name")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editTeamForm.control}
            name="roster"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forms.tournament.roster")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("forms.tournament.roster-placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <DialogFooter className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash className="mr-2 h-4 w-4" />
          {isDeleting
            ? t("forms.tournament.deleting")
            : t("forms.tournament.delete")}
        </Button>
        <Button type="submit" form="edit-team-form" disabled={isSaving}>
          {isSaving
            ? t("forms.tournament.saving")
            : t("forms.tournament.save-changes")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
