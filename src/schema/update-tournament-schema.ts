
"use client";
import { z } from "zod";

const teamSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name must not exceed 50 characters"),
  color: z.string(),
  roster: z.array(z.string()).optional(),
});

const updateTournamentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rules: z.string().optional(),
  teams: z.array(teamSchema).optional(),
  numberOfTeams: z.coerce.number().optional(),
  matchType: z.enum(["single_leg", "two_leg"]).optional(),
});

export default updateTournamentSchema;
