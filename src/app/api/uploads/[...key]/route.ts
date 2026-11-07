import { NextRequest } from "next/server";
import { getObject, isStorageConfigured } from "@/lib/s3";

export const runtime = "nodejs";

/**
 * Public read proxy for uploaded files.
 *
 * The backing object storage is private, so the browser cannot load its URLs
 * directly. This route signs a GET with the server-side credentials and
 * streams the object back from the app's own origin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string[] } },
): Promise<Response> {
  const key = (params.key ?? []).join("/");

  // Only serve objects created by the upload endpoint and never allow path
  // traversal or absolute URLs.
  if (
    !key ||
    !key.startsWith("uploads/") ||
    key.includes("..") ||
    key.includes("://")
  ) {
    return new Response("Not found", { status: 404 });
  }

  if (!isStorageConfigured()) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const res = await getObject(key);

    if (!res.ok || !res.body) {
      if (res.status !== 404) {
        const details = await res.text().catch(() => "");
        console.error("S3 read error:", res.status, details);
      }
      return new Response("Not found", {
        status: res.status === 404 ? 404 : 502,
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("content-type") || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");

    const contentLength = res.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(res.body, { status: 200, headers });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return new Response("Not found", { status: 502 });
  }
}
