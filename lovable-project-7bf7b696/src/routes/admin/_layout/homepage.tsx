import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Loader, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { AdminError, AdminLoading } from "@/components/admin/state-views";
import { PageHeader } from "@/components/admin/page-header";

import { FEATURE_ICON_CATALOG, FeatureIcon } from "@/lib/feature-icons";

import {
  getAdminSiteContent,
  updateAboutSection,
  updateHeroSection,
  type AdminAboutSectionDto,
  type AdminHeroSectionDto,
} from "@/lib/api/site-content.functions";
import {
  aboutSectionInputSchema,
  heroSectionInputSchema,
  type AboutSectionInput,
  type HeroSectionInput,
} from "@/lib/admin/schemas";

export const Route = createFileRoute("/admin/_layout/homepage")({
  head: () => ({
    meta: [{ title: "Homepage — Al-Arab Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: HomepagePage,
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function formatUpdatedAt(iso: string | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SaveButton({
  dirty,
  busy,
  onSave,
  label,
}: {
  dirty: boolean;
  busy: boolean;
  onSave: () => void;
  label: string;
}) {
  return (
    <Button onClick={onSave} disabled={!dirty || busy}>
      {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {busy ? "Saving…" : label}
    </Button>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      <Check className="h-3.5 w-3.5" /> Saved
    </span>
  );
}

type FeatureRow = { iconKey: string; label: string };
type WhyUsRow = { iconKey: string; label: string; description: string };

function IconKeySelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (key: string) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-52 shrink-0" aria-label={label}>
        <SelectValue placeholder="Pick icon" />
      </SelectTrigger>
      <SelectContent>
        {FEATURE_ICON_CATALOG.map((icon) => (
          <SelectItem key={icon.key} value={icon.key}>
            <span className="flex items-center gap-2">
              <icon.Icon className="h-4 w-4 text-brand" />
              {icon.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FeatureRowsEditor({
  rows,
  onChange,
  errors,
  rowErrorPrefix,
  withDescription,
  emptyHint,
  addLabel,
  rowLabel,
}: {
  rows: FeatureRow[] | WhyUsRow[];
  onChange: (rows: FeatureRow[] | WhyUsRow[]) => void;
  errors: Record<string, string>;
  rowErrorPrefix: string;
  withDescription?: boolean;
  emptyHint: string;
  addLabel: string;
  rowLabel: string;
}) {
  const set = (index: number, patch: Partial<FeatureRow> | Partial<WhyUsRow>) => {
    onChange(rows.map((r, i) => (i === index ? ({ ...r, ...patch } as FeatureRow) : r)));
  };

  const add = () =>
    onChange([
      ...rows,
      {
        iconKey: "star",
        label: "",
        ...(withDescription ? { description: "" } : {}),
      } as FeatureRow,
    ]);

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const errorAt = (key: string) => errors[`${rowErrorPrefix}.${key}`];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">{rowLabel}</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> {addLabel}
        </Button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
      {errors[rowErrorPrefix] && (
        <p className="text-xs text-destructive">{errors[rowErrorPrefix]}</p>
      )}
      {rows.map((row, i) => {
        const keyed = row as FeatureRow;
        const whyUs = row as WhyUsRow;
        return (
          <div
            key={`${rowErrorPrefix}-${i}`}
            className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3"
          >
            <IconKeySelect
              value={keyed.iconKey}
              onChange={(k) => set(i, { iconKey: k })}
              label={`${rowLabel} ${i + 1} icon`}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <Input
                  value={keyed.label}
                  onChange={(e) => set(i, { label: e.target.value })}
                  placeholder="Label"
                  maxLength={80}
                  aria-label={`${rowLabel} ${i + 1} label`}
                />
                {errorAt(`${i}.label`) && (
                  <p className="mt-1 text-xs text-destructive">{errorAt(`${i}.label`)}</p>
                )}
              </div>
              {withDescription && (
                <div>
                  <Input
                    value={whyUs.description}
                    onChange={(e) => set(i, { description: e.target.value })}
                    placeholder="Short description"
                    maxLength={200}
                    aria-label={`${rowLabel} ${i + 1} description`}
                  />
                  {errorAt(`${i}.description`) && (
                    <p className="mt-1 text-xs text-destructive">{errorAt(`${i}.description`)}</p>
                  )}
                </div>
              )}
              {errorAt(`${i}.iconKey`) && (
                <p className="text-xs text-destructive">{errorAt(`${i}.iconKey`)}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${rowLabel} ${i + 1} up`}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label={`Move ${rowLabel} ${i + 1} down`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => remove(i)}
                aria-label={`Remove ${rowLabel} ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomepagePage() {
  const queryClient = useQueryClient();

  const contentQuery = useQuery({
    queryKey: ["admin", "site-content"],
    queryFn: () => getAdminSiteContent(),
  });

  const heroMutation = useMutation({
    mutationFn: (input: HeroSectionInput) => updateHeroSection({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-content"] });
      toast.success("Hero section saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const aboutMutation = useMutation({
    mutationFn: (input: AboutSectionInput) => updateAboutSection({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-content"] });
      toast.success("About & Why Us section saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const data = contentQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Content"
        description="Edit the hero, about and why-us sections shown on your public homepage. Changes go live immediately."
      />

      {contentQuery.isError && (
        <AdminError
          message="Failed to load homepage content."
          onRetry={() => void contentQuery.refetch()}
        />
      )}

      {contentQuery.isLoading ? (
        <AdminLoading rows={3} />
      ) : data ? (
        <div className="space-y-6">
          <HeroSettingsCard
            key={`hero-${data.hero.updatedAt}`}
            hero={data.hero}
            busy={heroMutation.isPending}
            justSaved={heroMutation.isSuccess}
            onSubmit={(input) => heroMutation.mutate(input)}
          />
          <AboutSettingsCard
            key={`about-${data.about.updatedAt}`}
            about={data.about}
            busy={aboutMutation.isPending}
            justSaved={aboutMutation.isSuccess}
            onSubmit={(input) => aboutMutation.mutate(input)}
          />
        </div>
      ) : null}
    </div>
  );
}

function HeroSettingsCard({
  hero,
  busy,
  justSaved,
  onSubmit,
}: {
  hero: AdminHeroSectionDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: HeroSectionInput) => void;
}) {
  const [badgeText, setBadgeText] = useState(hero.badgeText ?? "");
  const [headline, setHeadline] = useState(hero.headline);
  const [headlineHighlight, setHeadlineHighlight] = useState(hero.headlineHighlight ?? "");
  const [subheadline, setSubheadline] = useState(hero.subheadline ?? "");
  const [arabicTagline, setArabicTagline] = useState(hero.arabicTagline ?? "");
  const [badgeTitle, setBadgeTitle] = useState(hero.badgeTitle ?? "");
  const [badgeSubtitle, setBadgeSubtitle] = useState(hero.badgeSubtitle ?? "");
  const [ctaPrimaryText, setCtaPrimaryText] = useState(hero.ctaPrimaryText ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(hero.ctaPrimaryHref ?? "");
  const [ctaSecondaryText, setCtaSecondaryText] = useState(hero.ctaSecondaryText ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(hero.ctaSecondaryHref ?? "");
  const [features, setFeatures] = useState<FeatureRow[]>(
    hero.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialFeatures = useMemo(
    () => hero.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
    [hero.features],
  );

  const dirty = useMemo(
    () =>
      badgeText !== (hero.badgeText ?? "") ||
      headline !== hero.headline ||
      headlineHighlight !== (hero.headlineHighlight ?? "") ||
      subheadline !== (hero.subheadline ?? "") ||
      arabicTagline !== (hero.arabicTagline ?? "") ||
      badgeTitle !== (hero.badgeTitle ?? "") ||
      badgeSubtitle !== (hero.badgeSubtitle ?? "") ||
      ctaPrimaryText !== (hero.ctaPrimaryText ?? "") ||
      ctaPrimaryHref !== (hero.ctaPrimaryHref ?? "") ||
      ctaSecondaryText !== (hero.ctaSecondaryText ?? "") ||
      ctaSecondaryHref !== (hero.ctaSecondaryHref ?? "") ||
      JSON.stringify(features) !== JSON.stringify(initialFeatures),
    [
      hero,
      features,
      initialFeatures,
      badgeText,
      headline,
      headlineHighlight,
      subheadline,
      arabicTagline,
      badgeTitle,
      badgeSubtitle,
      ctaPrimaryText,
      ctaPrimaryHref,
      ctaSecondaryText,
      ctaSecondaryHref,
    ],
  );

  const field = (key: string) => errors[key];

  const handleSubmit = () => {
    const parsed = heroSectionInputSchema.safeParse({
      badgeText: badgeText.trim() ? badgeText.trim() : null,
      headline,
      headlineHighlight: headlineHighlight.trim() ? headlineHighlight.trim() : null,
      subheadline: subheadline.trim() ? subheadline.trim() : null,
      arabicTagline: arabicTagline.trim() ? arabicTagline.trim() : null,
      badgeTitle: badgeTitle.trim() ? badgeTitle.trim() : null,
      badgeSubtitle: badgeSubtitle.trim() ? badgeSubtitle.trim() : null,
      ctaPrimaryText: ctaPrimaryText.trim() ? ctaPrimaryText.trim() : null,
      ctaPrimaryHref: ctaPrimaryHref.trim() ? ctaPrimaryHref.trim() : null,
      ctaSecondaryText: ctaSecondaryText.trim() ? ctaSecondaryText.trim() : null,
      ctaSecondaryHref: ctaSecondaryHref.trim() ? ctaSecondaryHref.trim() : null,
      features,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <Card className="shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FeatureIcon name="utensils-crossed" className="h-5 w-5 text-brand" /> Hero Section
        </CardTitle>
        <CardDescription>
          Badge, headline, Arabic tagline, heritage text, buttons and feature chips shown at the top
          of the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="hero-badge"
            label="Delivery badge text"
            error={field("badgeText")}
            className="sm:col-span-2"
          >
            <Input
              id="hero-badge"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              maxLength={80}
              placeholder="Delivery All Over Karachi"
            />
          </Field>
          <Field id="hero-headline" label="Headline" error={field("headline")}>
            <Input
              id="hero-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={60}
              placeholder="Al-Arab"
            />
          </Field>
          <Field
            id="hero-headline-highlight"
            label="Headline highlight (gold)"
            error={field("headlineHighlight")}
          >
            <Input
              id="hero-headline-highlight"
              value={headlineHighlight}
              onChange={(e) => setHeadlineHighlight(e.target.value)}
              maxLength={60}
              placeholder="Shawarma"
            />
          </Field>
          <Field
            id="hero-subheadline"
            label="Subheadline"
            error={field("subheadline")}
            className="sm:col-span-2"
          >
            <Textarea
              id="hero-subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </Field>
          <Field
            id="hero-arabic"
            label="Arabic tagline"
            hint="Rendered right-to-left below the subheadline."
            error={field("arabicTagline")}
            className="sm:col-span-2"
          >
            <Input
              id="hero-arabic"
              value={arabicTagline}
              onChange={(e) => setArabicTagline(e.target.value)}
              maxLength={80}
              dir="rtl"
              placeholder="ذوق العرب الأصيل"
            />
          </Field>
          <Field id="hero-badge-title" label="Heritage badge title" error={field("badgeTitle")}>
            <Input
              id="hero-badge-title"
              value={badgeTitle}
              onChange={(e) => setBadgeTitle(e.target.value)}
              maxLength={60}
              placeholder="A Legacy of Flavor"
            />
          </Field>
          <Field
            id="hero-badge-subtitle"
            label="Heritage badge subtitle"
            error={field("badgeSubtitle")}
          >
            <Input
              id="hero-badge-subtitle"
              value={badgeSubtitle}
              onChange={(e) => setBadgeSubtitle(e.target.value)}
              maxLength={120}
              placeholder="Established in 1991 | Registered in 1998"
            />
          </Field>
          <Field
            id="hero-cta-primary-text"
            label="Primary button text"
            error={field("ctaPrimaryText")}
          >
            <Input
              id="hero-cta-primary-text"
              value={ctaPrimaryText}
              onChange={(e) => setCtaPrimaryText(e.target.value)}
              maxLength={40}
              placeholder="View Menu"
            />
          </Field>
          <Field
            id="hero-cta-primary-href"
            label="Primary button link"
            error={field("ctaPrimaryHref")}
          >
            <Input
              id="hero-cta-primary-href"
              value={ctaPrimaryHref}
              onChange={(e) => setCtaPrimaryHref(e.target.value)}
              maxLength={200}
              placeholder="#menu"
            />
          </Field>
          <Field
            id="hero-cta-secondary-text"
            label="Secondary button text"
            error={field("ctaSecondaryText")}
          >
            <Input
              id="hero-cta-secondary-text"
              value={ctaSecondaryText}
              onChange={(e) => setCtaSecondaryText(e.target.value)}
              maxLength={40}
              placeholder="Order Now"
            />
          </Field>
          <Field
            id="hero-cta-secondary-href"
            label="Secondary button link"
            error={field("ctaSecondaryHref")}
          >
            <Input
              id="hero-cta-secondary-href"
              value={ctaSecondaryHref}
              onChange={(e) => setCtaSecondaryHref(e.target.value)}
              maxLength={200}
              placeholder="#checkout"
            />
          </Field>
        </div>

        <div className="border-t border-border/60 pt-4">
          <FeatureRowsEditor
            rows={features}
            onChange={(r) => setFeatures(r as FeatureRow[])}
            errors={errors}
            rowErrorPrefix="features"
            emptyHint="Add chips shown under the hero buttons (e.g. Fresh Ingredients, Halal Food)."
            addLabel="Add feature"
            rowLabel="Hero features"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(hero.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            <SavedBadge show={justSaved && !dirty} />
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save hero" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutSettingsCard({
  about,
  busy,
  justSaved,
  onSubmit,
}: {
  about: AdminAboutSectionDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: AboutSectionInput) => void;
}) {
  const [badgeLabel, setBadgeLabel] = useState(about.badgeLabel ?? "");
  const [heading, setHeading] = useState(about.heading);
  const [headingHighlight, setHeadingHighlight] = useState(about.headingHighlight ?? "");
  const [body, setBody] = useState(about.body);
  const [imageOverlayTitle, setImageOverlayTitle] = useState(about.imageOverlayTitle ?? "");
  const [imageOverlayText, setImageOverlayText] = useState(about.imageOverlayText ?? "");
  const [whyUsHeading, setWhyUsHeading] = useState(about.whyUsHeading ?? "");
  const [whyUsHeadingHighlight, setWhyUsHeadingHighlight] = useState(
    about.whyUsHeadingHighlight ?? "",
  );
  const [features, setFeatures] = useState<FeatureRow[]>(
    about.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
  );
  const [whyUsFeatures, setWhyUsFeatures] = useState<WhyUsRow[]>(
    about.whyUsFeatures.map((f) => ({
      iconKey: f.iconKey,
      label: f.label,
      description: f.description,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialFeatures = useMemo(
    () => about.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
    [about.features],
  );
  const initialWhyUsFeatures = useMemo(
    () =>
      about.whyUsFeatures.map((f) => ({
        iconKey: f.iconKey,
        label: f.label,
        description: f.description,
      })),
    [about.whyUsFeatures],
  );

  const dirty = useMemo(
    () =>
      badgeLabel !== (about.badgeLabel ?? "") ||
      heading !== about.heading ||
      headingHighlight !== (about.headingHighlight ?? "") ||
      body !== about.body ||
      imageOverlayTitle !== (about.imageOverlayTitle ?? "") ||
      imageOverlayText !== (about.imageOverlayText ?? "") ||
      whyUsHeading !== (about.whyUsHeading ?? "") ||
      whyUsHeadingHighlight !== (about.whyUsHeadingHighlight ?? "") ||
      JSON.stringify(features) !== JSON.stringify(initialFeatures) ||
      JSON.stringify(whyUsFeatures) !== JSON.stringify(initialWhyUsFeatures),
    [
      about,
      features,
      initialFeatures,
      whyUsFeatures,
      initialWhyUsFeatures,
      badgeLabel,
      heading,
      headingHighlight,
      body,
      imageOverlayTitle,
      imageOverlayText,
      whyUsHeading,
      whyUsHeadingHighlight,
    ],
  );

  const field = (key: string) => errors[key];

  const handleSubmit = () => {
    const parsed = aboutSectionInputSchema.safeParse({
      badgeLabel: badgeLabel.trim() ? badgeLabel.trim() : null,
      heading,
      headingHighlight: headingHighlight.trim() ? headingHighlight.trim() : null,
      body,
      imageOverlayTitle: imageOverlayTitle.trim() ? imageOverlayTitle.trim() : null,
      imageOverlayText: imageOverlayText.trim() ? imageOverlayText.trim() : null,
      whyUsHeading: whyUsHeading.trim() ? whyUsHeading.trim() : null,
      whyUsHeadingHighlight: whyUsHeadingHighlight.trim() ? whyUsHeadingHighlight.trim() : null,
      features,
      whyUsFeatures,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <Card className="shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FeatureIcon name="shield-check" className="h-5 w-5 text-brand" /> About & Why Us
        </CardTitle>
        <CardDescription>
          The about story (image stays fixed), its feature cards, and the why-us grid further down
          the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="about-badge" label="Section badge" error={field("badgeLabel")}>
            <Input
              id="about-badge"
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              maxLength={60}
              placeholder="About Al-Arab"
            />
          </Field>
          <Field id="about-heading" label="Heading" error={field("heading")}>
            <Input
              id="about-heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              maxLength={80}
              placeholder="Authentic recipes, "
            />
          </Field>
          <Field
            id="about-heading-highlight"
            label="Heading highlight (gold)"
            error={field("headingHighlight")}
          >
            <Input
              id="about-heading-highlight"
              value={headingHighlight}
              onChange={(e) => setHeadingHighlight(e.target.value)}
              maxLength={60}
              placeholder="premium quality"
            />
          </Field>
          <Field
            id="about-overlay-title"
            label="Image overlay title"
            error={field("imageOverlayTitle")}
          >
            <Input
              id="about-overlay-title"
              value={imageOverlayTitle}
              onChange={(e) => setImageOverlayTitle(e.target.value)}
              maxLength={60}
              placeholder="Hand-shaved. Flame-grilled."
            />
          </Field>
          <Field
            id="about-overlay-text"
            label="Image overlay text"
            error={field("imageOverlayText")}
          >
            <Input
              id="about-overlay-text"
              value={imageOverlayText}
              onChange={(e) => setImageOverlayText(e.target.value)}
              maxLength={200}
              placeholder="Slow-roasted on a vertical spit, just like in Arabia."
            />
          </Field>
          <Field
            id="about-body"
            label="Story content"
            error={field("body")}
            className="sm:col-span-2"
          >
            <Textarea
              id="about-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1200}
              rows={5}
            />
          </Field>
        </div>

        <div className="border-t border-border/60 pt-4">
          <FeatureRowsEditor
            rows={features}
            onChange={(r) => setFeatures(r as FeatureRow[])}
            errors={errors}
            rowErrorPrefix="features"
            emptyHint="Add the feature cards next to the about story."
            addLabel="Add feature"
            rowLabel="About features"
          />
        </div>

        <div className="border-t border-border/60 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="why-us-heading" label="Why us heading" error={field("whyUsHeading")}>
              <Input
                id="why-us-heading"
                value={whyUsHeading}
                onChange={(e) => setWhyUsHeading(e.target.value)}
                maxLength={60}
                placeholder="Karachi's "
              />
            </Field>
            <Field
              id="why-us-heading-highlight"
              label="Why us heading highlight (gold)"
              error={field("whyUsHeadingHighlight")}
            >
              <Input
                id="why-us-heading-highlight"
                value={whyUsHeadingHighlight}
                onChange={(e) => setWhyUsHeadingHighlight(e.target.value)}
                maxLength={60}
                placeholder="Favorite"
              />
            </Field>
          </div>
          <div className="mt-4">
            <FeatureRowsEditor
              rows={whyUsFeatures}
              onChange={(r) => setWhyUsFeatures(r as WhyUsRow[])}
              errors={errors}
              rowErrorPrefix="whyUsFeatures"
              withDescription
              emptyHint="Add the cards in the 'Why Choose Us' grid."
              addLabel="Add why-us card"
              rowLabel="Why-us cards"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(about.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            <SavedBadge show={justSaved && !dirty} />
            <SaveButton
              dirty={dirty}
              busy={busy}
              onSave={handleSubmit}
              label="Save about & why us"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
