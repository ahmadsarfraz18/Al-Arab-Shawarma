import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2, Store } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authClient } from "@/lib/auth/auth-client";

const resetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export const Route = createFileRoute("/admin/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset Password — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    if (!token) {
      setError("This link is missing its reset token.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      if (resetError) {
        setError(
          resetError.message ??
            "Unable to reset the password. The link may be invalid, expired, or already used.",
        );
        return;
      }
      setSuccess(true);
    } catch {
      setError("Unable to reset the password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-brand">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Reset <span className="text-gradient-gold">Password</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your admin account.
          </p>
        </div>

        {!token ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card-soft sm:p-8">
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              This link is missing its reset token.
            </div>
            <p className="text-sm text-muted-foreground">
              Use the full one-time link from the password reset instructions. It expires after one
              hour.
            </p>
            <Link
              to="/admin/login"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        ) : success ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card-soft sm:p-8">
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Password reset successfully.
            </div>
            <p className="text-sm text-muted-foreground">
              Any other sessions were signed out. You can now sign in with your new password.
            </p>
            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => window.location.assign("/admin/login")}
            >
              Go to sign in
            </Button>
          </div>
        ) : (
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
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  aria-invalid={errors.password ? true : undefined}
                  className={`h-11 bg-background ${errors.password ? "border-destructive" : ""}`}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                  aria-invalid={errors.confirm ? true : undefined}
                  className={`h-11 bg-background ${errors.confirm ? "border-destructive" : ""}`}
                  {...register("confirm")}
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Resetting…
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/admin/login" className="hover:text-foreground">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
