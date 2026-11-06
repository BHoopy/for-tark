"use server";

import { getSql } from "@/lib/neon";
import { getSessionUser } from "@/lib/auth";
import type { tournamentBody } from "@/types/types";

const DEFAULT_COVER_IMAGE =
  "https://res.cloudinary.com/dwoklp9vo/image/upload/v1757560924/Screenshot_2025-09-08_152618_m86jwu.avif";

type TournamentDto = Omit<tournamentBody, "createdAt"> & {
  createdAt: string | null;
};

async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

function mapTournamentRow(r: Record<string, any>): TournamentDto {
  return {
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
  } as TournamentDto;
}

export async function getTournamentById(id: string): Promise<TournamentDto> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, description, rules, format, match_type, status,
           created_by, created_at, updated_at, cover_image_url,
           number_of_teams, moderators, fixtures
    FROM psimply.tournaments
    WHERE id = ${id}
    LIMIT 1
  `) as Record<string, any>[];

  if (!rows || rows.length === 0) {
    throw new Error("Tournament not found");
  }

  return mapTournamentRow(rows[0]);
}

export async function getUserTournaments(
  userId: string,
): Promise<TournamentDto[]> {
  if (!userId) return [];

  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, description, rules, format, match_type, status,
           created_by, created_at, updated_at, cover_image_url,
           number_of_teams, moderators, fixtures
    FROM psimply.tournaments
    WHERE created_by = ${userId}
    ORDER BY created_at DESC
  `) as Record<string, any>[];

  return (rows ?? []).map(mapTournamentRow);
}

export async function createTournament(input: {
  name: string;
  description?: string;
  rules?: string;
  format: "round_robin" | "knockout" | "group_then_knockout";
  matchType?: "single_leg" | "two_leg";
  numberOfTeams?: number;
  moderators?: string[];
}): Promise<{ id: string }> {
  const user = await requireSession();

  const sql = getSql();
  const rows = (await sql`
    INSERT INTO psimply.tournaments (
      id, name, description, rules, format, match_type, status,
      created_by, cover_image_url, number_of_teams, moderators
    ) VALUES (
      gen_random_uuid()::text,
      ${input.name},
      ${input.description ?? null},
      ${input.rules ?? null},
      ${input.format},
      ${input.matchType ?? null},
      ${"draft"},
      ${user.uid},
      ${DEFAULT_COVER_IMAGE},
      ${input.numberOfTeams ?? null},
      ${input.moderators ?? []}
    )
    RETURNING id
  `) as Record<string, any>[];

  return { id: rows[0].id };
}

export async function updateTournament(
  id: string,
  updatedTournament: Partial<tournamentBody>,
): Promise<void> {
  await requireSession();

  const sql = getSql();
  const { name, description, rules, numberOfTeams, matchType, coverImageUrl } =
    updatedTournament;

  const hasName = name !== undefined;
  const hasDescription = description !== undefined;
  const hasRules = rules !== undefined;
  const hasNumberOfTeams = numberOfTeams !== undefined;
  const hasMatchType = matchType !== undefined;
  const hasCoverImageUrl = coverImageUrl !== undefined;

  await sql`
    UPDATE psimply.tournaments
    SET
      name = CASE WHEN ${hasName} THEN ${name ?? null} ELSE name END,
      description = CASE WHEN ${hasDescription} THEN ${description ?? null} ELSE description END,
      rules = CASE WHEN ${hasRules} THEN ${rules ?? null} ELSE rules END,
      number_of_teams = CASE WHEN ${hasNumberOfTeams} THEN ${numberOfTeams ?? null} ELSE number_of_teams END,
      match_type = CASE WHEN ${hasMatchType} THEN ${matchType ?? null} ELSE match_type END,
      cover_image_url = CASE WHEN ${hasCoverImageUrl} THEN ${coverImageUrl ?? null} ELSE cover_image_url END,
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteTournament(id: string): Promise<void> {
  await requireSession();

  const sql = getSql();
  await sql`
    DELETE FROM psimply.tournaments
    WHERE id = ${id}
  `;
}

export async function updateTournamentModerators(
  tournamentId: string,
  userId: string,
  action: "add" | "remove",
): Promise<void> {
  await requireSession();

  const sql = getSql();

  if (action === "add") {
    await sql`
      UPDATE psimply.tournaments
      SET moderators = CASE
        WHEN ${userId} = ANY(COALESCE(moderators, '{}'))
          THEN moderators
        ELSE array_append(COALESCE(moderators, '{}'), ${userId})
      END,
          updated_at = NOW()
      WHERE id = ${tournamentId}
    `;
  } else {
    await sql`
      UPDATE psimply.tournaments
      SET moderators = array_remove(COALESCE(moderators, '{}'), ${userId}),
          updated_at = NOW()
      WHERE id = ${tournamentId}
    `;
  }
}
