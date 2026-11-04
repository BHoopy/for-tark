
"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { useEditTournament } from "@/backend-calls";
import Image from "next/image";

interface UpdateTournamentCoverFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tournamentId: string;
}

export function UpdateTournamentCoverForm({
  setOpen,
  tournamentId,
}: UpdateTournamentCoverFormProps) {
  const t = useTranslations();
  const form = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const editTournamentMutation = useEditTournament({ id: tournamentId });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setPreview(reader.result?.toString() || ""),
      );
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: t("toast.cover-image-update-fail.title"),
        description: "Please select an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { secure_url } = response.data;

      await editTournamentMutation.mutateAsync({ coverImageUrl: secure_url });

      toast({
        title: t("toast.cover-image-update-success.title"),
        description: t("toast.cover-image-update-success.description"),
      });
      setOpen(false);
      setPreview("");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: t("toast.cover-image-update-fail.title"),
        description: t("toast.cover-image-update-fail.description"),
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="picture"
          render={() => (
            <FormItem>
              <FormControl>
                <Input type="file" accept="image/*" onChange={onSelectFile} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {preview && (
          <div className="relative mt-4 h-48 w-full">
            <Image
              src={preview}
              alt="Image preview"
              fill
              className="rounded-md object-contain"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={!selectedFile || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? t("forms.tournament.saving")
            : t("forms.tournament.save-changes")}
        </Button>
      </form>
    </Form>
  );
}
