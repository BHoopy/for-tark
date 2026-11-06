import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon";
import { getSessionUser, mapUserRow } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TEXT_FIELDS = [
  "displayName",
  "photoURL",
  "coverImageURL",
  "whatsapp",
  "x",
  "facebook",
  "phone",
  "discord",
] as const;

export async function PATCH(req: Request): Promise<Response> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values: Record<string, string | null> = {};
  for (const field of TEXT_FIELDS) {
    if (typeof body[field] === "string") {
      values[field] = (body[field] as string).trim() || null;
    }
  }

  try {
    const sql = getSql();
    const rows = (await sql`
      UPDATE psimply.users
      SET
        display_name = COALESCE(${values.displayName ?? null}, display_name),
        photo_url = COALESCE(${values.photoURL ?? null}, photo_url),
        cover_image_url = COALESCE(${values.coverImageURL ?? null}, cover_image_url),
        whatsapp = COALESCE(${values.whatsapp ?? null}, whatsapp),
        x = COALESCE(${values.x ?? null}, x),
        facebook = COALESCE(${values.facebook ?? null}, facebook),
        phone = COALESCE(${values.phone ?? null}, phone),
        discord = COALESCE(${values.discord ?? null}, discord),
        updated_at = now()
      WHERE uid = ${sessionUser.uid}
      RETURNING id, uid, email, display_name, photo_url, cover_image_url, is_guest
    `) as Record<string, any>[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: mapUserRow(rows[0]) });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Could not update your profile. Please try again." },
      { status: 500 },
    );
  }
}
