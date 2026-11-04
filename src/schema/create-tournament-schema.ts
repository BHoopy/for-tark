
"use client";
import { z } from "zod";

const createTournamentSchema = z
  .object({
    name: z
      .string()
      .min(2, "Tournament name must be at least 2 characters long")
      .max(50, "Tournament name must not exceed 50 characters"),
    format: z.enum(["round_robin", "knockout", "group_then_knockout"], {
      required_error: "You need to select a tournament format.",
    }),
    matchType: z.enum(["single_leg", "two_leg"]).optional(),
    numberOfTeams: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (
        data.format === "knockout" ||
        data.format === "group_then_knockout"
      ) {
        return !!data.numberOfTeams;
      }
      return true;
    },
    {
      message: "Number of teams is required for this format.",
      path: ["numberOfTeams"],
    },
  );

export default createTournamentSchema;
