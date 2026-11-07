"use server";

import { getSql } from "@/lib/neon";
import { getSessionUser } from "@/lib/auth";
import type { Match, TeamList, teamBody } from "@/types/types";

async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function getTournamentTeams(
  tournamentId: string,
): Promise<teamBody[]> {
  if (!tournamentId) return [];

  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, color, roster, logo
    FROM psimply.teams
    WHERE tournament_id = ${tournamentId}
  `) as Record<string, any>[];

  return (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color ?? undefined,
    roster: r.roster ?? [],
    logo: r.logo ?? undefined,
  })) as teamBody[];
}

export async function getTournamentMatches(
  tournamentId: string,
): Promise<Match[]> {
  if (!tournamentId) return [];

  const sql = getSql();
  const rows = (await sql`
    SELECT id, round, match_number, team1_id, team2_id,
           score1_leg1, score2_leg1, score1_leg2, score2_leg2,
           status, next_match_id, is_bronze_match
    FROM psimply.matches
    WHERE tournament_id = ${tournamentId}
  `) as Record<string, any>[];

  return (rows ?? []).map((r) => ({
    id: r.id,
    round: r.round,
    matchNumber: r.match_number,
    team1Id: r.team1_id,
    team2Id: r.team2_id,
    score1_leg1: r.score1_leg1,
    score2_leg1: r.score2_leg1,
    score1_leg2: r.score1_leg2,
    score2_leg2: r.score2_leg2,
    status: r.status,
    nextMatchId: r.next_match_id,
    isBronzeMatch: r.is_bronze_match,
  })) as Match[];
}

export async function addTeam(
  tournamentId: string,
  team: Omit<teamBody, "id">,
): Promise<{ id: string }> {
  await requireSession();
  if (!tournamentId) throw new Error("Tournament ID is missing.");

  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO psimply.teams (id, tournament_id, name, color, roster, logo)
    VALUES (
      ${id},
      ${tournamentId},
      ${team.name},
      ${team.color ?? null},
      ${team.roster ?? []},
      ${team.logo || null}
    )
  `;

  return { id };
}

export async function addTeams(
  tournamentId: string,
  teams: Omit<teamBody, "id">[],
): Promise<void> {
  await requireSession();
  if (!tournamentId) throw new Error("Tournament ID is missing.");

  const sql = getSql();
  for (const team of teams) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO psimply.teams (id, tournament_id, name, color, roster, logo)
      VALUES (
        ${id},
        ${tournamentId},
        ${team.name},
        ${team.color ?? null},
        ${team.roster ?? []},
        ${team.logo || null}
      )
    `;
  }
}

export async function updateTeam(
  tournamentId: string,
  team: teamBody,
): Promise<void> {
  await requireSession();
  if (!tournamentId || !team.id) {
    throw new Error("Tournament ID or Team ID is missing.");
  }

  const sql = getSql();

  if (team.name !== undefined) {
    await sql`
      UPDATE psimply.teams SET name = ${team.name}
      WHERE id = ${team.id} AND tournament_id = ${tournamentId}
    `;
  }
  if (team.color !== undefined) {
    await sql`
      UPDATE psimply.teams SET color = ${team.color}
      WHERE id = ${team.id} AND tournament_id = ${tournamentId}
    `;
  }
  if (team.roster !== undefined) {
    await sql`
      UPDATE psimply.teams SET roster = ${team.roster}
      WHERE id = ${team.id} AND tournament_id = ${tournamentId}
    `;
  }
  if (team.logo !== undefined) {
    await sql`
      UPDATE psimply.teams SET logo = ${team.logo}
      WHERE id = ${team.id} AND tournament_id = ${tournamentId}
    `;
  }
}

export async function deleteTeam(
  tournamentId: string,
  teamId: string,
): Promise<void> {
  await requireSession();
  if (!tournamentId) throw new Error("Tournament ID is missing.");

  const sql = getSql();
  await sql`
    DELETE FROM psimply.teams
    WHERE id = ${teamId} AND tournament_id = ${tournamentId}
  `;
}

export async function getTeamLists(): Promise<TeamList[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, teams
    FROM psimply.team_lists
    ORDER BY name ASC
  `) as Record<string, any>[];

  return (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    teams: r.teams ?? [],
  })) as TeamList[];
}

export async function saveTeamList(input: {
  listName: string;
  teams: { name: string; logo: string }[];
}): Promise<{ id: string }> {
  await requireSession();

  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO psimply.team_lists (id, name, teams)
    VALUES (${id}, ${input.listName}, ${JSON.stringify(input.teams)}::jsonb)
  `;

  return { id };
}

export async function deleteTeamList(listId: string): Promise<void> {
  await requireSession();

  const sql = getSql();
  await sql`
    DELETE FROM psimply.team_lists
    WHERE id = ${listId}
  `;
}
