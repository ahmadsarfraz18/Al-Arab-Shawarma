import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Store } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authClient } from "@/lib/auth/auth-client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/admin/_layout/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Al-Arab Shawarma" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });
      if (signInError) {
        setError(
          signInError.status === 401
            ? "Invalid email or password."
            : "Unable to sign in. Please try again.",
        );
        return;
      }
      // Full page navigation so the server-side guard verifies the new session.
      window.location.assign("/admin");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Enter your admin email address.");
      return;
    }
    setForgotError(null);
    setForgotBusy(true);
    try {
      // Always resolves successfully (even for unknown emails) so the form
      // doesn't reveal whether an account exists.
      const { error: resetError } = await authClient.requestPasswordReset({
        email: forgotEmail.trim(),
        redirectTo: "/admin/reset-password",
      });
      if (resetError) {
        setForgotError("Unable to start a reset. Please try again.");
        return;
      }
      setForgotSent(true);
    } catch {
      setForgotError("Unable to start a reset. Please try again.");
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-brand">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Al-Arab <span className="text-gradient-gold">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage the restaurant panel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-3xl border border-border bg-card p-6 shadow-card-soft sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@al-arbalshawarma.com"
                  aria-invalid={errors.email ? true : undefined}
                  className={`h-11 pl-10 bg-background ${errors.email ? "border-destructive" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? true : undefined}
                  className={`h-11 pl-10 pr-10 bg-background ${errors.password ? "border-destructive" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setForgotEmail("");
              setForgotError(null);
              setForgotSent(false);
              setForgotOpen(true);
            }}
            className="mt-4 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-brand hover:underline"
          >
            Forgot password?
          </button>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">
            ← Back to website
          </a>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={(o) => !forgotBusy && setForgotOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot password</DialogTitle>
            <DialogDescription>
              {forgotSent
                ? "Reset link ready."
                : "Enter your admin email to request a password reset."}
            </DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div className="space-y-3">
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This site has no email service, so the one-time reset link is written to the
                  server logs. Open the <strong>Vercel function logs</strong> and search for{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.8em]">
                    password reset link
                  </code>{" "}
                  — the latest entry contains your link.
                </span>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                <li>The link is valid for one hour.</li>
                <li>Open it in this browser to reach the reset page.</li>
                <li>Any existing admin sessions are signed out after a reset.</li>
              </ul>
              <DialogFooter className="mt-4">
                <Button className="w-full" onClick={() => setForgotOpen(false)}>
                  Got it
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={onForgotSubmit} noValidate className="space-y-4">
              {forgotError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {forgotError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Admin email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@al-arbalshawarma.com"
                  className="h-11 bg-background"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotBusy}>
                  {forgotBusy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Requesting…
                    </>
                  ) : (
                    "Request reset link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
