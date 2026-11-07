import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isStorageConfigured, putObject } from "@/lib/s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const INLINE_FALLBACK_LIMIT = 256 * 1024; // keep data URLs small if storage is missing

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return fail("No file uploaded.");
    }

    if (file.size === 0) {
      return fail("The uploaded file is empty.");
    }

    if (file.size > MAX_FILE_SIZE) {
      return fail("The image is too large. Please upload a file under 5 MB.");
    }

    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(contentType)) {
      return fail("Unsupported file type. Please upload a PNG, JPEG, WebP, GIF, AVIF or SVG image.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Without storage credentials the app still needs to work. Keep the old
    // inline behaviour for small images only, so the database never stores
    // multi-megabyte base64 blobs.
    if (!isStorageConfigured()) {
      if (buffer.byteLength > INLINE_FALLBACK_LIMIT) {
        return fail(
          "Image storage is not configured. Please upload a smaller image or configure S3 storage.",
          503,
        );
      }
      const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ secure_url: dataUrl, storage: "inline" });
    }

    const safeName =
      (file.name || "image")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(-80) || "image";
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

    const res = await putObject(key, buffer, contentType);

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      console.error("S3 upload error:", res.status, details);
      return fail("The image could not be uploaded. Please try again.", 502);
    }

    // The storage object is private, so expose it through our own route.
    // This keeps the URL stable and same-origin (no next/image host or CORS
    // configuration needed).
    return NextResponse.json({
      secure_url: `/api/uploads/${key}`,
      key,
      storage: "s3",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return fail("The image could not be uploaded. Please try again.", 500);
  }
}
