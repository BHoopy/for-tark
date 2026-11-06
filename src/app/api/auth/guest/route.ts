import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon";
import { createSession, mapUserRow } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    const sql = getSql();
    const uid = randomUUID();

    const rows = (await sql`
      INSERT INTO psimply.users (id, uid, display_name, is_guest)
      VALUES (${uid}, ${uid}, ${"Guest"}, true)
      RETURNING id, uid, email, display_name, photo_url, cover_image_url, is_guest
    `) as Record<string, any>[];

    createSession(uid);

    return NextResponse.json({ user: mapUserRow(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "Could not start a guest session. Please try again." },
      { status: 500 },
    );
  }
}
