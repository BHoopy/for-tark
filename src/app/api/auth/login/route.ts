import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon";
import { createSession, mapUserRow, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, uid, email, display_name, photo_url, cover_image_url,
             is_guest, password_hash
      FROM psimply.users
      WHERE lower(email) = ${email}
      LIMIT 1
    `) as Record<string, any>[];

    const row = rows[0];
    const valid = row
      ? await verifyPassword(password, row.password_hash ?? null)
      : false;

    if (!row || !valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    createSession(row.uid);

    return NextResponse.json({ user: mapUserRow(row) });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}
