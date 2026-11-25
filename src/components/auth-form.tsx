"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/demo";
import { authClient } from "@/lib/auth-client";
import { safeNextPath } from "@/lib/slug";

export function AuthForm({
  mode,
  next,
  github,
  google,
}: {
  mode: "login" | "signup";
  next?: string;
  github: boolean;
  google: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackURL = safeNextPath(next);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const result =
      mode === "login"
        ? await authClient.signIn.email({ email, password, callbackURL })
        : await authClient.signUp.email({ email, password, name, callbackURL });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not continue.");
      return;
    }
    toast.success(mode === "login" ? "Welcome back." : "Account created.");
    router.push(callbackURL);
    router.refresh();
  }

  async function social(provider: "github" | "google") {
    await authClient.signIn.social({ provider, callbackURL });
  }

  return (
    <div className="space-y-6">
      <form action={submit} className="space-y-4">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required minLength={2} />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="grid gap-2">
        <Button type="button" variant="outline" disabled={!github} onClick={() => social("github")}>
          {github ? "Continue with GitHub" : "GitHub OAuth needs keys"}
        </Button>
        <Button type="button" variant="outline" disabled={!google} onClick={() => social("google")}>
          {google ? "Continue with Google" : "Google OAuth needs keys"}
        </Button>
      </div>

      {mode === "login" ? (
        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Local demo · password {DEMO_PASSWORD}
          </p>
          <div className="mt-3 grid gap-2">
            {DEMO_USERS.map((person) => (
              <button
                key={person.email}
                type="button"
                data-testid={`demo-${person.email}`}
                className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-left text-sm hover:bg-secondary/70"
                onClick={() => {
                  const form = document.querySelector("form");
                  if (!(form instanceof HTMLFormElement)) return;
                  const email = form.elements.namedItem("email");
                  const password = form.elements.namedItem("password");
                  if (email instanceof HTMLInputElement) email.value = person.email;
                  if (password instanceof HTMLInputElement) password.value = DEMO_PASSWORD;
                  form.requestSubmit();
                }}
              >
                <span>
                  <span className="block font-medium">{person.name}</span>
                  <span className="text-muted-foreground">{person.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">{person.role}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here? <Link className="text-foreground underline underline-offset-4" href="/signup">Create an account</Link>
          </>
        ) : (
          <>
            Already have a pad? <Link className="text-foreground underline underline-offset-4" href="/login">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}
