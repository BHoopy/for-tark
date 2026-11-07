"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useUpdateTeam } from "@/backend-calls";
import { teamBody } from "@/types/types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_SIZE = 512;

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<File> {
  if (!crop || !crop.width || !crop.height) {
    throw new Error("Please select a valid crop area.");
  }
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("The selected image could not be loaded.");
  }

  // Crop coordinates are in displayed pixels, so translate them to the
  // image's natural resolution before drawing.
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sourceX = Math.max(0, Math.min(image.naturalWidth, crop.x * scaleX));
  const sourceY = Math.max(0, Math.min(image.naturalHeight, crop.y * scaleY));
  const sourceWidth = Math.min(
    image.naturalWidth - sourceX,
    crop.width * scaleX,
  );
  const sourceHeight = Math.min(
    image.naturalHeight - sourceY,
    crop.height * scaleY,
  );

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Please select a valid crop area.");
  }

  // Keep logos crisp without producing huge uploads.
  const scale = Math.min(
    1,
    MAX_LOGO_SIZE / Math.max(sourceWidth, sourceHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Your browser could not process this image.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The cropped image is empty."));
          return;
        }
        resolve(new File([blob], "team-logo.png", { type: "image/png" }));
      },
      "image/png",
      1,
    );
  });
}

interface UpdateTeamLogoFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tournamentId: string;
  team: teamBody;
  onSuccess?: () => void;
}

export function UpdateTeamLogoForm({
  setOpen,
  tournamentId,
  team,
  onSuccess,
}: UpdateTeamLogoFormProps) {
  const t = useTranslations();
  const form = useForm();
  const imgRef = useRef<HTMLImageElement>(null);

  const updateTeamMutation = useUpdateTeam({ tournamentId });

  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect] = useState<number>(1);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("toast.team-logo-update-fail.title"),
        description: "Please choose an image file.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: t("toast.team-logo-update-fail.title"),
        description: "The image is too large. Please choose a file under 5 MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Clear any previous selection so a stale crop cannot be submitted.
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImgSrc("");

    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setImgSrc(reader.result?.toString() || ""),
    );
    reader.addEventListener("error", () => {
      toast({
        title: t("toast.team-logo-update-fail.title"),
        description: "The image could not be read. Please try another file.",
        variant: "destructive",
      });
    });
    reader.readAsDataURL(file);
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (!width || !height) return;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  const onSubmit = async () => {
    const image = imgRef.current;

    if (!completedCrop || !image) {
      toast({
        title: t("toast.team-logo-update-fail.title"),
        description: "Please select and crop an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      const croppedImageFile = await getCroppedImg(image, completedCrop);

      const formData = new FormData();
      formData.append("file", croppedImageFile);

      const response = await axios.post("/api/upload", formData);
      const secureUrl: unknown = response.data?.secure_url;

      if (typeof secureUrl !== "string" || !secureUrl) {
        throw new Error("The upload did not return an image URL.");
      }

      await updateTeamMutation.mutateAsync({ ...team, logo: secureUrl });

      toast({
        title: t("toast.team-logo-update-success.title"),
        description: t("toast.team-logo-update-success.description"),
      });

      // Only close/reset once everything succeeded. Updating the parent
      // instead of reloading avoids blanking the page after an upload.
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : t("toast.team-logo-update-fail.description");

      toast({
        title: t("toast.team-logo-update-fail.title"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const isBusy = form.formState.isSubmitting || updateTeamMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="logo"
          render={() => (
            <FormItem>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                  onChange={onSelectFile}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {imgSrc && (
          <div className="flex flex-col items-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: "200px" }}
              />
            </ReactCrop>
          </div>
        )}

        <Button type="submit" disabled={!completedCrop || isBusy}>
          {isBusy
            ? t("forms.tournament.saving")
            : t("forms.tournament.save-changes")}
        </Button>
      </form>
    </Form>
  );
}
