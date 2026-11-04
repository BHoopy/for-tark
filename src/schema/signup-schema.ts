
"use client";
import { z } from "zod";

const signupSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export default signupSchema;
