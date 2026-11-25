import { z } from "zod";

export function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export const launchInput = z.object({
  name: z.string().trim().min(2, "Give the launch a name.").max(80),
  summary: z.string().trim().max(400, "Keep the summary under 400 characters."),
  targetDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use a real date."),
  status: z.enum(["draft", "ready", "launched"]),
});

export const taskInput = z.object({
  title: z.string().trim().min(2, "Add a task title.").max(140),
});

export const inviteInput = z.object({
  email: z.email("Enter a valid email."),
  role: z.enum(["admin", "member"]),
});

export const orgNameInput = z.object({
  name: z.string().trim().min(2, "Name the organisation.").max(60),
});

export const profileInput = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters.").max(80),
});

export const signupInput = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters.").max(80),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});
