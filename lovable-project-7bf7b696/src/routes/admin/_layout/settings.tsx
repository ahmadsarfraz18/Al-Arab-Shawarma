import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Loader,
  MapPin,
  MessageCircle,
  Palette,
  Pencil,
  Plus,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminError, AdminLoading } from "@/components/admin/state-views";
import { PageHeader } from "@/components/admin/page-header";

import { DAY_ABBR, MON_FIRST_DAYS } from "@/lib/opening-hours";

import {
  createSocialLink,
  deleteSocialLink,
  getAdminSiteSettings,
  setSocialLinkStatus,
  updateContactSettings,
  updateOpeningHours,
  updatePaymentSettings,
  updateSeoSettings,
  updateSocialLink,
  updateThemeSettings,
  type AdminContactSettingsDto,
  type AdminOpeningHourDto,
  type AdminPaymentSettingsDto,
  type AdminSeoSettingsDto,
  type AdminSocialLinkDto,
  type AdminThemeSettingsDto,
} from "@/lib/api/site-settings.functions";
import { derivePalette, normalizeTheme } from "@/lib/theme";
import { robotsContent } from "@/lib/seo";
import {
  CONTENT_STATUSES,
  contactSettingsSchema,
  openingHoursInputSchema,
  paymentSettingsSchema,
  seoSettingsSchema,
  socialLinkInputSchema,
  SOCIAL_PLATFORMS,
  themeSettingsSchema,
  TWITTER_CARD_TYPES,
  type ContentStatus,
  type ContactSettingsInput,
  type OpeningHourType,
  type OpeningHoursInput,
  type PaymentSettingsInput,
  type SeoSettingsInput,
  type SocialLinkInput,
  type SocialPlatform,
  type ThemeSettingsInput,
  type TwitterCardType,
} from "@/lib/admin/schemas";

export const Route = createFileRoute("/admin/_layout/settings")({
  head: () => ({
    meta: [{ title: "Settings — Al-Arab Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SettingsPage,
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

function SettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => getAdminSiteSettings(),
  });

  const contactMutation = useMutation({
    mutationFn: (input: ContactSettingsInput) => updateContactSettings({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Contact settings saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const paymentMutation = useMutation({
    mutationFn: (input: PaymentSettingsInput) => updatePaymentSettings({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Payment settings saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const openingHoursMutation = useMutation({
    mutationFn: (input: OpeningHoursInput) => updateOpeningHours({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Opening hours saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveSocialMutation = useMutation({
    mutationFn: (input: { id?: string; values: SocialLinkInput }) =>
      input.id
        ? updateSocialLink({ data: { ...input.values, id: input.id } })
        : createSocialLink({ data: input.values }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Social link saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const setStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: ContentStatus }) =>
      setSocialLinkStatus({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Social link status updated");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteSocialMutation = useMutation({
    mutationFn: (id: string) => deleteSocialLink({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Social link deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const themeMutation = useMutation({
    mutationFn: (input: ThemeSettingsInput) => updateThemeSettings({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Theme settings saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const seoMutation = useMutation({
    mutationFn: (input: SeoSettingsInput) => updateSeoSettings({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("SEO settings saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const data = settingsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Edit the contact, payment, opening hours and SEO shown on your public website. Changes go live immediately."
      />

      {settingsQuery.isError && (
        <AdminError
          message="Failed to load settings."
          onRetry={() => void settingsQuery.refetch()}
        />
      )}

      {settingsQuery.isLoading ? (
        <AdminLoading rows={2} />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactSettingsCard
            key={`contact-${data.contact.updatedAt}`}
            contact={data.contact}
            busy={contactMutation.isPending}
            justSaved={contactMutation.isSuccess}
            onSubmit={(input) => contactMutation.mutate(input)}
          />
          <PaymentSettingsCard
            key={`payment-${data.payment.updatedAt}`}
            payment={data.payment}
            busy={paymentMutation.isPending}
            justSaved={paymentMutation.isSuccess}
            onSubmit={(input) => paymentMutation.mutate(input)}
          />
          <OpeningHoursCard
            key={`hours-${data.openingHours.items.map((h) => h.updatedAt).join("-")}`}
            items={data.openingHours.items}
            busy={openingHoursMutation.isPending}
            justSaved={openingHoursMutation.isSuccess}
            onSubmit={(input) => openingHoursMutation.mutate(input)}
          />
          <SocialLinksCard
            links={data.socialLinks}
            saveBusy={saveSocialMutation.isPending}
            statusBusy={setStatusMutation.isPending}
            onSave={(input) => saveSocialMutation.mutate(input)}
            onSetStatus={(input) => setStatusMutation.mutate(input)}
            onDelete={(id) => deleteSocialMutation.mutate(id)}
          />
          <ThemeSettingsCard
            key={`theme-${data.theme.updatedAt}`}
            theme={data.theme}
            busy={themeMutation.isPending}
            justSaved={themeMutation.isSuccess}
            onSubmit={(input) => themeMutation.mutate(input)}
          />
          <SeoSettingsCard
            key={`seo-${data.seo.updatedAt}`}
            seo={data.seo}
            busy={seoMutation.isPending}
            justSaved={seoMutation.isSuccess}
            onSubmit={(input) => seoMutation.mutate(input)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ContactSettingsCard({
  contact,
  busy,
  justSaved,
  onSubmit,
}: {
  contact: AdminContactSettingsDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: ContactSettingsInput) => void;
}) {
  const [restaurantName, setRestaurantName] = useState(contact.restaurantName);
  const [tagline, setTagline] = useState(contact.tagline ?? "");
  const [phoneDisplay, setPhoneDisplay] = useState(contact.phoneDisplay);
  const [phoneTel, setPhoneTel] = useState(contact.phoneTel);
  const [whatsappNumber, setWhatsappNumber] = useState(contact.whatsappNumber);
  const [address, setAddress] = useState(contact.address);
  const [email, setEmail] = useState(contact.email ?? "");
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState(contact.mapsEmbedUrl ?? "");
  const [mapsDirectionsUrl, setMapsDirectionsUrl] = useState(contact.mapsDirectionsUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () =>
      restaurantName !== contact.restaurantName ||
      tagline !== (contact.tagline ?? "") ||
      phoneDisplay !== contact.phoneDisplay ||
      phoneTel !== contact.phoneTel ||
      whatsappNumber !== contact.whatsappNumber ||
      address !== contact.address ||
      email !== (contact.email ?? "") ||
      mapsEmbedUrl !== (contact.mapsEmbedUrl ?? "") ||
      mapsDirectionsUrl !== (contact.mapsDirectionsUrl ?? ""),
    [
      contact,
      restaurantName,
      tagline,
      phoneDisplay,
      phoneTel,
      whatsappNumber,
      address,
      email,
      mapsEmbedUrl,
      mapsDirectionsUrl,
    ],
  );

  const field = (key: string) => errors[key];

  const handleSubmit = () => {
    const parsed = contactSettingsSchema.safeParse({
      restaurantName,
      tagline: tagline.trim() ? tagline.trim() : null,
      phoneDisplay,
      phoneTel,
      whatsappNumber,
      address,
      email: email.trim() ? email.trim() : null,
      mapsEmbedUrl: mapsEmbedUrl.trim() ? mapsEmbedUrl.trim() : null,
      mapsDirectionsUrl: mapsDirectionsUrl.trim() ? mapsDirectionsUrl.trim() : null,
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
          <MapPin className="h-5 w-5 text-brand" /> Contact Information
        </CardTitle>
        <CardDescription>
          Business name, phones, WhatsApp and location shown across the website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="contact-restaurant-name"
            label="Restaurant name"
            error={field("restaurantName")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-restaurant-name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field
            id="contact-tagline"
            label="Tagline"
            error={field("tagline")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field id="contact-phone-display" label="Display phone" error={field("phoneDisplay")}>
            <Input
              id="contact-phone-display"
              value={phoneDisplay}
              onChange={(e) => setPhoneDisplay(e.target.value)}
              maxLength={30}
              placeholder="0333-3686848"
            />
          </Field>
          <Field id="contact-phone-tel" label="Phone (tel: link)" error={field("phoneTel")}>
            <Input
              id="contact-phone-tel"
              value={phoneTel}
              onChange={(e) => setPhoneTel(e.target.value)}
              maxLength={30}
              placeholder="+92-333-3686848"
            />
          </Field>
          <Field
            id="contact-whatsapp"
            label="WhatsApp number"
            hint="Digits only, with country code — powers the order and chat buttons."
            error={field("whatsappNumber")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-whatsapp"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              maxLength={30}
              placeholder="923333686848"
            />
          </Field>
          <Field
            id="contact-address"
            label="Address"
            error={field("address")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field
            id="contact-email"
            label="Email (optional)"
            error={field("email")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              placeholder="hello@example.com"
            />
          </Field>
          <Field
            id="contact-map-embed"
            label="Map embed URL (optional)"
            hint="Used for the embedded map on the contact section."
            error={field("mapsEmbedUrl")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-map-embed"
              type="url"
              value={mapsEmbedUrl}
              onChange={(e) => setMapsEmbedUrl(e.target.value)}
              maxLength={500}
              placeholder="https://www.google.com/maps?q=…&output=embed"
            />
          </Field>
          <Field
            id="contact-map-directions"
            label="Get directions URL (optional)"
            error={field("mapsDirectionsUrl")}
            className="sm:col-span-2"
          >
            <Input
              id="contact-map-directions"
              type="url"
              value={mapsDirectionsUrl}
              onChange={(e) => setMapsDirectionsUrl(e.target.value)}
              maxLength={500}
              placeholder="https://www.google.com/maps/search/?api=1&query=…"
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(contact.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save contact" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentSettingsCard({
  payment,
  busy,
  justSaved,
  onSubmit,
}: {
  payment: AdminPaymentSettingsDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: PaymentSettingsInput) => void;
}) {
  const [easypaisaNumber, setEasypaisaNumber] = useState(payment.easypaisaNumber);
  const [easypaisaTitle, setEasypaisaTitle] = useState(payment.easypaisaTitle);
  const [bankName, setBankName] = useState(payment.bankName);
  const [bankTitle, setBankTitle] = useState(payment.bankTitle);
  const [bankIban, setBankIban] = useState(payment.bankIban);
  const [paymentNote, setPaymentNote] = useState(payment.paymentNote ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () =>
      easypaisaNumber !== payment.easypaisaNumber ||
      easypaisaTitle !== payment.easypaisaTitle ||
      bankName !== payment.bankName ||
      bankTitle !== payment.bankTitle ||
      bankIban !== payment.bankIban ||
      paymentNote !== (payment.paymentNote ?? ""),
    [payment, easypaisaNumber, easypaisaTitle, bankName, bankTitle, bankIban, paymentNote],
  );

  const field = (key: string) => errors[key];

  const handleSubmit = () => {
    const parsed = paymentSettingsSchema.safeParse({
      easypaisaNumber,
      easypaisaTitle,
      bankName,
      bankTitle,
      bankIban,
      paymentNote: paymentNote.trim() ? paymentNote.trim() : null,
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
          <Building2 className="h-5 w-5 text-brand" /> Payment Settings
        </CardTitle>
        <CardDescription>
          Easypaisa and bank transfer details shown at checkout. The QR code is unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="payment-easypaisa-number"
            label="Easypaisa number"
            error={field("easypaisaNumber")}
          >
            <Input
              id="payment-easypaisa-number"
              value={easypaisaNumber}
              onChange={(e) => setEasypaisaNumber(e.target.value)}
              maxLength={30}
              placeholder="0333-3686848"
            />
          </Field>
          <Field
            id="payment-easypaisa-title"
            label="Easypaisa account title"
            error={field("easypaisaTitle")}
          >
            <Input
              id="payment-easypaisa-title"
              value={easypaisaTitle}
              onChange={(e) => setEasypaisaTitle(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field id="payment-bank-name" label="Bank name" error={field("bankName")}>
            <Input
              id="payment-bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              maxLength={80}
              placeholder="Faysal Bank"
            />
          </Field>
          <Field id="payment-bank-title" label="Bank account title" error={field("bankTitle")}>
            <Input
              id="payment-bank-title"
              value={bankTitle}
              onChange={(e) => setBankTitle(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field
            id="payment-bank-iban"
            label="IBAN"
            hint="Letters and numbers only, no spaces."
            error={field("bankIban")}
            className="sm:col-span-2"
          >
            <Input
              id="payment-bank-iban"
              value={bankIban}
              onChange={(e) => setBankIban(e.target.value.toUpperCase())}
              maxLength={40}
              placeholder="PK86FAYS…"
            />
          </Field>
          <Field
            id="payment-note"
            label="Payment note (optional)"
            error={field("paymentNote")}
            className="sm:col-span-2"
          >
            <Textarea
              id="payment-note"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(payment.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save payment" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OpeningHoursCard({
  items,
  busy,
  justSaved,
  onSubmit,
}: {
  items: AdminOpeningHourDto[];
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: OpeningHoursInput) => void;
}) {
  const [edits, setEdits] = useState<
    Record<string, { openTime: string; closeTime: string; isClosed: boolean }>
  >(() =>
    Object.fromEntries(
      items.map((h) => [
        `${h.type}-${h.dayOfWeek}`,
        { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () =>
      items.some((h) => {
        const e = edits[`${h.type}-${h.dayOfWeek}`];
        return (
          !e ||
          e.openTime !== h.openTime ||
          e.closeTime !== h.closeTime ||
          e.isClosed !== h.isClosed
        );
      }),
    [items, edits],
  );

  const set = (
    type: OpeningHourType,
    dayOfWeek: number,
    patch: Partial<{ openTime: string; closeTime: string; isClosed: boolean }>,
  ) => {
    const key = `${type}-${dayOfWeek}`;
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { openTime: "16:00", closeTime: "04:00", isClosed: false }),
        ...patch,
      },
    }));
  };

  const handleSubmit = () => {
    const payload: OpeningHoursInput = {
      items: items.map((h) => {
        const e = edits[`${h.type}-${h.dayOfWeek}`];
        return {
          dayOfWeek: h.dayOfWeek,
          type: h.type,
          openTime: e?.openTime ?? h.openTime,
          closeTime: e?.closeTime ?? h.closeTime,
          isClosed: e?.isClosed ?? h.isClosed,
        };
      }),
    };

    const parsed = openingHoursInputSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const [section, idx, field] = issue.path as [string, number, string];
        if (section === "items" && typeof idx === "number") {
          const row = payload.items[idx];
          const key = row ? `${row.type}-${row.dayOfWeek}` : "hours";
          if (!next[key]) next[key] = `${field} — ${issue.message}`;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  };

  const lastUpdated = items.reduce(
    (latest, h) => (new Date(h.updatedAt) > new Date(latest) ? h.updatedAt : latest),
    items[0]?.updatedAt ?? "",
  );

  return (
    <Card className="lg:col-span-2 shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Clock className="h-5 w-5 text-brand" /> Opening Hours
        </CardTitle>
        <CardDescription>
          Restaurant and delivery hours shown across the website and in search results (JSON-LD).
          Times are 24-hour; mark a day Closed to disable its times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(["restaurant", "delivery"] as const).map((type) => (
          <div key={type} className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {type === "restaurant" ? "Restaurant Hours" : "Delivery Hours"}
            </h4>
            <div className="grid grid-cols-[72px_1fr_1fr_92px] items-center gap-x-3 gap-y-2">
              {MON_FIRST_DAYS.map((day) => {
                const row = items.find((i) => i.type === type && i.dayOfWeek === day);
                if (!row) return null;
                const key = `${type}-${day}`;
                const e = edits[key] ?? {
                  openTime: row.openTime,
                  closeTime: row.closeTime,
                  isClosed: row.isClosed,
                };
                const closed = e.isClosed;
                return (
                  <Fragment key={day}>
                    <span className="text-sm font-medium text-muted-foreground">
                      {DAY_ABBR[day]}
                    </span>
                    <Input
                      type="time"
                      value={e.openTime}
                      disabled={closed}
                      onChange={(ev) => set(type, day, { openTime: ev.target.value })}
                      aria-label={`${DAY_ABBR[day]} ${type} open time`}
                    />
                    <Input
                      type="time"
                      value={e.closeTime}
                      disabled={closed}
                      onChange={(ev) => set(type, day, { closeTime: ev.target.value })}
                      aria-label={`${DAY_ABBR[day]} ${type} close time`}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Switch
                        checked={closed}
                        onCheckedChange={(v) => set(type, day, { isClosed: v })}
                      />
                      Closed
                    </label>
                    {errors[key] && (
                      <p className="col-span-4 text-xs text-destructive">{errors[key]}</p>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(lastUpdated)}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save hours" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SOCIAL_PLATFORM_META: Record<SocialPlatform, { label: string; Icon: typeof Share2 }> = {
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  instagram: { label: "Instagram", Icon: Instagram },
  facebook: { label: "Facebook", Icon: Facebook },
};

function SocialLinksCard({
  links,
  saveBusy,
  statusBusy,
  onSave,
  onSetStatus,
  onDelete,
}: {
  links: AdminSocialLinkDto[];
  saveBusy: boolean;
  statusBusy: boolean;
  onSave: (input: { id?: string; values: SocialLinkInput }) => void;
  onSetStatus: (input: { id: string; status: ContentStatus }) => void;
  onDelete: (id: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSocialLinkDto | null>(null);

  const activeCount = links.filter((l) => l.status === "ACTIVE").length;

  return (
    <Card className="lg:col-span-2 shadow-card-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Share2 className="h-5 w-5 text-brand" /> Social Links
          </CardTitle>
          <CardDescription>
            Facebook, Instagram and WhatsApp buttons shown in the website footer. Only active links
            with a real URL are shown publicly.
          </CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={saveBusy}
        >
          <Plus /> Add Link
        </Button>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No social links yet. Add your Facebook, Instagram or WhatsApp profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Platform</TableHead>
                  <TableHead className="min-w-[220px]">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const meta = SOCIAL_PLATFORM_META[link.platform];
                  const Icon = meta?.Icon ?? Share2;
                  return (
                    <TableRow key={link.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-semibold">
                          <Icon className="h-4 w-4 shrink-0 text-brand" />
                          {meta?.label ?? link.platform}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {link.url}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={link.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{link.displayOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={link.status === "ACTIVE"}
                            disabled={statusBusy}
                            onCheckedChange={(v) =>
                              onSetStatus({
                                id: link.id,
                                status: v ? "ACTIVE" : "HIDDEN",
                              })
                            }
                            aria-label={`Toggle ${link.platform} visibility`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(link);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${link.platform} link`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            title="Delete social link?"
                            description={
                              <>
                                The {meta?.label ?? link.platform} link will be permanently removed.
                                This cannot be undone.
                              </>
                            }
                            confirmLabel="Delete"
                            onConfirm={() => onDelete(link.id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${link.platform} link`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {activeCount} of {links.length} link(s) active. Placeholder URLs ("#") are never shown on
          the public website.
        </p>
      </CardContent>

      {formOpen && (
        <SocialLinkFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          link={editing}
          existingPlatforms={links.filter((l) => l.id !== editing?.id).map((l) => l.platform)}
          busy={saveBusy}
          onSubmit={onSave}
        />
      )}
    </Card>
  );
}

function SocialLinkFormDialog({
  open,
  onOpenChange,
  link,
  existingPlatforms,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: AdminSocialLinkDto | null;
  existingPlatforms: SocialPlatform[];
  busy: boolean;
  onSubmit: (input: { id?: string; values: SocialLinkInput }) => void;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>(link?.platform ?? "whatsapp");
  const [url, setUrl] = useState(link?.url ?? "");
  const [status, setStatus] = useState<ContentStatus>(link?.status ?? "ACTIVE");
  const [displayOrder, setDisplayOrder] = useState(link ? String(link.displayOrder) : "0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const parsed = socialLinkInputSchema.safeParse({
      platform,
      url,
      status,
      displayOrder: displayOrder === "" ? 0 : Number(displayOrder),
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
    onSubmit(link ? { id: link.id, values: parsed.data } : { values: parsed.data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? "Edit Social Link" : "Add Social Link"}</DialogTitle>
          <DialogDescription>
            Links appear as buttons in the website footer. Only active links with a valid URL are
            shown publicly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="social-platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger id="social-platform" aria-label="Select platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => {
                  const meta = SOCIAL_PLATFORM_META[p];
                  const taken = existingPlatforms.includes(p) && p !== platform;
                  return (
                    <SelectItem key={p} value={p} disabled={taken}>
                      {meta.label}
                      {taken ? " (already added)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social-url">Profile URL</Label>
            <Input
              id="social-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                platform === "whatsapp"
                  ? "https://wa.me/923333686848"
                  : `https://www.${platform}.com/yourpage`
              }
              maxLength={500}
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="social-order">Display order</Label>
              <Input
                id="social-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              {errors.displayOrder && (
                <p className="text-xs text-destructive">{errors.displayOrder}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="social-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger id="social-status" aria-label="Select status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "ACTIVE" ? "Active" : s === "HIDDEN" ? "Hidden" : "Archived"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            WhatsApp buttons link to the phone number in Contact Settings. Fake or placeholder URLs
            are rejected.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {link ? "Save changes" : "Add link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toPickerValue(hex: string): string {
  const six = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (six) return `#${six[1].toLowerCase()}`;
  const three = /^#([0-9a-f]{3})$/i.exec(hex.trim());
  if (three) {
    const h = three[1].toLowerCase();
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return "#000000";
}

function ThemeSettingsCard({
  theme,
  busy,
  justSaved,
  onSubmit,
}: {
  theme: AdminThemeSettingsDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: ThemeSettingsInput) => void;
}) {
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  const [textColor, setTextColor] = useState(theme.textColor);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () =>
      primaryColor !== theme.primaryColor ||
      secondaryColor !== theme.secondaryColor ||
      accentColor !== theme.accentColor ||
      backgroundColor !== theme.backgroundColor ||
      textColor !== theme.textColor,
    [theme, primaryColor, secondaryColor, accentColor, backgroundColor, textColor],
  );

  const palette = useMemo(
    () =>
      derivePalette(
        normalizeTheme({
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          textColor,
        }),
      ),
    [primaryColor, secondaryColor, accentColor, backgroundColor, textColor],
  );

  const handleSubmit = () => {
    const parsed = themeSettingsSchema.safeParse({
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
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

  const field = (key: string) => errors[key];

  const swatches: Array<{ label: string; value: string }> = [
    { label: "Background", value: palette.background },
    { label: "Foreground", value: palette.foreground },
    { label: "Brand", value: palette.brand },
    { label: "Gold", value: palette.gold },
    { label: "Card", value: palette.card },
    { label: "Muted", value: palette.muted },
    { label: "Border", value: palette.border },
  ];

  return (
    <Card className="lg:col-span-2 shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Palette className="h-5 w-5 text-brand" /> Theme Settings
        </CardTitle>
        <CardDescription>
          Brand colors are injected into the public site before first paint. Derived tokens (card,
          muted, border, gradients, …) are computed automatically from these values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              [
                "Primary / brand",
                "primaryColor",
                primaryColor,
                setPrimaryColor,
                "Accent buttons, links and highlights",
              ],
              [
                "Secondary / gold",
                "secondaryColor",
                secondaryColor,
                setSecondaryColor,
                "Borders, badges and secondary accents",
              ],
              [
                "Accent surface",
                "accentColor",
                accentColor,
                setAccentColor,
                "Hover surfaces and accent backgrounds",
              ],
              [
                "Background",
                "backgroundColor",
                backgroundColor,
                setBackgroundColor,
                "Page and body background",
              ],
              ["Text", "textColor", textColor, setTextColor, "Primary text color"],
            ] as const
          ).map(([label, key, value, setter, hint]) => (
            <Field key={key} id={`theme-${key}`} label={label} hint={hint} error={field(key)}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={toPickerValue(value)}
                  onChange={(e) => setter(e.target.value)}
                  aria-label={`${label} color picker`}
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-card p-1"
                />
                <Input
                  id={`theme-${key}`}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  maxLength={9}
                  placeholder="#39ff14"
                />
              </div>
            </Field>
          ))}
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Live palette preview</p>
          <div className="flex flex-wrap gap-2">
            {swatches.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1"
              >
                <span
                  className="h-5 w-5 rounded border border-foreground/20"
                  style={{ backgroundColor: s.value }}
                  aria-hidden
                />
                <span className="text-[11px] text-muted-foreground">
                  {s.label} · {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(theme.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save theme" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CharCounter({ value, limit, warnAt }: { value: string; limit: number; warnAt?: number }) {
  const len = value.length;
  const tone =
    len > limit
      ? "text-destructive"
      : warnAt !== undefined && len > warnAt
        ? "text-amber-500"
        : "text-muted-foreground";
  return (
    <span className={`text-[11px] tabular-nums ${tone}`}>
      {len}/{limit}
    </span>
  );
}

function SeoSettingsCard({
  seo,
  busy,
  justSaved,
  onSubmit,
}: {
  seo: AdminSeoSettingsDto;
  busy: boolean;
  justSaved: boolean;
  onSubmit: (input: SeoSettingsInput) => void;
}) {
  const [title, setTitle] = useState(seo.title);
  const [description, setDescription] = useState(seo.description);
  const [keywords, setKeywords] = useState(seo.keywords ?? "");
  const [robotsIndex, setRobotsIndex] = useState(seo.robotsIndex);
  const [robotsFollow, setRobotsFollow] = useState(seo.robotsFollow);
  const [ogTitle, setOgTitle] = useState(seo.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(seo.ogDescription ?? "");
  const [twitterCard, setTwitterCard] = useState<TwitterCardType>(
    seo.twitterCard === "summary" ? "summary" : "summary_large_image",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(seo.canonicalUrl ?? "/");
  const [jsonLdText, setJsonLdText] = useState(() => JSON.stringify(seo.jsonLd ?? {}, null, 2));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => {
    let parsedJsonLd: unknown = null;
    try {
      parsedJsonLd = jsonLdText.trim() === "" ? null : JSON.parse(jsonLdText);
    } catch {
      return true;
    }
    return (
      title !== seo.title ||
      description !== seo.description ||
      (keywords.trim() || null) !== (seo.keywords ?? null) ||
      robotsIndex !== seo.robotsIndex ||
      robotsFollow !== seo.robotsFollow ||
      (ogTitle.trim() || null) !== (seo.ogTitle ?? null) ||
      (ogDescription.trim() || null) !== (seo.ogDescription ?? null) ||
      twitterCard !== (seo.twitterCard ?? "summary_large_image") ||
      (canonicalUrl.trim() || null) !== (seo.canonicalUrl ?? null) ||
      JSON.stringify(parsedJsonLd) !== JSON.stringify(seo.jsonLd)
    );
  }, [
    seo,
    title,
    description,
    keywords,
    robotsIndex,
    robotsFollow,
    ogTitle,
    ogDescription,
    twitterCard,
    canonicalUrl,
    jsonLdText,
  ]);

  const handleSubmit = () => {
    let parsedJsonLd: Record<string, unknown> | null;
    try {
      const raw = jsonLdText.trim();
      parsedJsonLd = raw === "" ? null : (JSON.parse(raw) as Record<string, unknown>);
      if (
        parsedJsonLd !== null &&
        (typeof parsedJsonLd !== "object" || Array.isArray(parsedJsonLd))
      ) {
        setErrors({ jsonLd: "JSON-LD must be a JSON object (not an array or string)." });
        return;
      }
    } catch {
      setErrors({ jsonLd: "Invalid JSON. Check the syntax." });
      return;
    }

    const parsed = seoSettingsSchema.safeParse({
      title,
      description,
      keywords: keywords.trim() || null,
      robotsIndex,
      robotsFollow,
      ogTitle: ogTitle.trim() || null,
      ogDescription: ogDescription.trim() || null,
      twitterCard,
      canonicalUrl: canonicalUrl.trim() || null,
      jsonLd: parsedJsonLd,
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

  const field = (key: string) => errors[key];

  return (
    <Card className="lg:col-span-2 shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Globe className="h-5 w-5 text-brand" /> SEO Settings
        </CardTitle>
        <CardDescription>
          Search-engine metadata for the public homepage. Rendered server-side before first paint,
          with a 60-second cache that refreshes as soon as you save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Google search preview</p>
          <div className="mt-3 max-w-xl rounded-md bg-white p-3 shadow-sm">
            <div className="truncate text-base font-medium leading-snug text-[#1a0dab]">
              {title || "Al-Arab Shawarma — …"}
            </div>
            <div className="mt-0.5 text-xs text-[#4d5156]">{canonicalUrl || "/"}</div>
            <div className="mt-1 line-clamp-2 text-xs leading-snug text-[#4d5156]">
              {description || "Your meta description appears here…"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              id="seo-title"
              label="Title tag"
              hint="Keep it under 60 characters so it isn't truncated in results."
              error={field("title")}
            >
              <Input
                id="seo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={70}
                placeholder="Al-Arab Shawarma — Order Authentic Arabic Shawarma in Karachi"
              />
              <CharCounter value={title} limit={70} warnAt={60} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              id="seo-description"
              label="Meta description"
              hint="160 characters max. Mention location, delivery and ordering naturally."
              error={field("description")}
            >
              <Textarea
                id="seo-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={160}
                rows={3}
              />
              <CharCounter value={description} limit={160} warnAt={150} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              id="seo-keywords"
              label="Keywords"
              hint="Comma-separated. Use only relevant phrases — Google ignores this tag, but it is kept for completeness."
              error={field("keywords")}
            >
              <Input
                id="seo-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                maxLength={400}
                placeholder="Al-Arab Shawarma, shawarma Karachi, Arabic shawarma, …"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Robots</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Allow indexing</div>
                <div className="text-xs text-muted-foreground">
                  Lets Google list this page in results.
                </div>
              </div>
              <Switch
                checked={robotsIndex}
                onCheckedChange={setRobotsIndex}
                aria-label="Allow indexing"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Follow links</div>
                <div className="text-xs text-muted-foreground">
                  Lets crawlers follow links on the page.
                </div>
              </div>
              <Switch
                checked={robotsFollow}
                onCheckedChange={setRobotsFollow}
                aria-label="Follow links"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Rendered robots meta:{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px]">
              {robotsContent(robotsIndex, robotsFollow)}
            </code>
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <p className="text-xs font-medium text-muted-foreground sm:col-span-2">
            Social sharing (Open Graph & Twitter)
          </p>
          <Field
            id="seo-og-title"
            label="OG / Twitter title"
            hint="Shown when your page is shared. Defaults to the title tag."
            error={field("ogTitle")}
          >
            <Input
              id="seo-og-title"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              maxLength={70}
              placeholder="Al-Arab Shawarma — Order Online in Karachi"
            />
            <CharCounter value={ogTitle} limit={70} />
          </Field>
          <Field
            id="seo-og-description"
            label="OG / Twitter description"
            hint="Defaults to the meta description."
            error={field("ogDescription")}
          >
            <Input
              id="seo-og-description"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              maxLength={160}
              placeholder="Authentic Arabic shawarma delivered across Karachi."
            />
            <CharCounter value={ogDescription} limit={160} />
          </Field>
          <Field id="seo-twitter-card" label="Twitter card type" error={field("twitterCard")}>
            <Select value={twitterCard} onValueChange={(v) => setTwitterCard(v as TwitterCardType)}>
              <SelectTrigger id="seo-twitter-card" aria-label="Twitter card type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TWITTER_CARD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "summary_large_image" ? "Summary with large image" : "Summary"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="seo-og-image"
            label="Share image (read-only)"
            hint="The image used for social shares and JSON-LD. Managed from the media library via the ogImage record."
          >
            <div className="truncate rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              {seo.ogImageUrl || "No image set"}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="seo-canonical"
            label="Canonical URL"
            hint='Use "/" for the homepage or a full URL like https://example.com/.'
            error={field("canonicalUrl")}
          >
            <Input
              id="seo-canonical"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              maxLength={500}
              placeholder="/"
            />
          </Field>
        </div>

        <Field
          id="seo-jsonld"
          label="JSON-LD structured data"
          hint="Extra Restaurant schema fields (cuisine, price range, area served, maps). Name, address, phone, hours and real social links are always taken from Contact / Hours / Social settings."
          error={field("jsonLd")}
        >
          <Textarea
            id="seo-jsonld"
            value={jsonLdText}
            onChange={(e) => setJsonLdText(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(seo.updatedAt)}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <SaveButton dirty={dirty} busy={busy} onSave={handleSubmit} label="Save SEO" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
