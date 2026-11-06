import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/neon";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_LIMIT = 9;
const MAX_PAGE_LIMIT = 50;

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const requestedPage = Number(searchParams.get("page"));
  const requestedLimit = Number(searchParams.get("pageLimit"));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  try {
    const sql = getSql();

    const countRows = (await sql`
      SELECT COUNT(*)::int AS count FROM psimply.tournaments
    `) as { count: number }[];
    const totalCount = Number(countRows[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageLimit);

    const offset = (page - 1) * pageLimit;
    const rows = (await sql`
      SELECT id, name, description, rules, format, match_type, status,
             created_by, created_at, updated_at, cover_image_url,
             number_of_teams, moderators, fixtures
      FROM psimply.tournaments
      ORDER BY created_at DESC
      LIMIT ${pageLimit} OFFSET ${offset}
    `) as Record<string, any>[];

    const tournaments = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      rules: r.rules,
      format: r.format,
      matchType: r.match_type,
      status: r.status,
      createdBy: r.created_by,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      coverImageUrl: r.cover_image_url,
      numberOfTeams: r.number_of_teams,
      moderators: r.moderators ?? [],
      fixtures: r.fixtures ?? [],
    }));

    return NextResponse.json({
      tournaments,
      totalCount,
      totalPages,
      page,
      pageLimit,
    });
  } catch (error) {
    console.error("Error fetching paginated tournaments:", error);
    return NextResponse.json(
      { error: "Failed to load tournaments" },
      { status: 500 },
    );
  }
}
