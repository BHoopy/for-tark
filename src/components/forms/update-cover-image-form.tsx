
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
import { useUser } from "@/hooks/use-user";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase/firebase";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { doc, getFirestore, setDoc } from "firebase/firestore";

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
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(
          new File([blob], "cropped-image.jpeg", { type: "image/jpeg" }),
        );
      },
      "image/jpeg",
      0.95,
    );
  });
}

interface UpdateCoverImageFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function UpdateCoverImageForm({ setOpen }: UpdateCoverImageFormProps) {
  const t = useTranslations();
  const { user } = useUser();
  const db = getFirestore(app);
  const form = useForm();
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect] = useState<number>(16 / 9);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || ""),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const onSubmit = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({
        title: t("toast.cover-image-update-fail.title"),
        description: "Please select and crop an image.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setOpen(false);
    setImgSrc("");

    try {
      const croppedImageFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
      );
      const formData = new FormData();
      formData.append("file", croppedImageFile);

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { secure_url } = response.data;

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { coverImageURL: secure_url }, { merge: true });

      toast({
        title: t("toast.cover-image-update-success.title"),
        description: t("toast.cover-image-update-success.description"),
      });

      // force reload to show new image
      window.location.reload();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="picture"
          render={() => (
            <FormItem>
              <FormLabel>{t("forms.profile.cover-image")}</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={onSelectFile} />
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
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: "400px" }}
              />
            </ReactCrop>
          </div>
        )}

        <Button
          type="submit"
          disabled={!completedCrop || form.formState.isSubmitting}
        >
          {t("forms.profile.update")}
        </Button>
      </form>
    </Form>
  );
}
