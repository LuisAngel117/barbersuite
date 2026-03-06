"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { type ClientPayload } from "@/lib/backend";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export type ClientFormSubmission = {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean;
};

type ClientFormProps = {
  initialClient?: ClientPayload | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: ClientFormSubmission) => Promise<void> | void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function ClientForm({
  initialClient,
  isSubmitting,
  onCancel,
  onSubmit,
}: ClientFormProps) {
  const tClients = useTranslations("clients.form");
  const [fullName, setFullName] = useState(initialClient?.fullName ?? "");
  const [phone, setPhone] = useState(initialClient?.phone ?? "");
  const [email, setEmail] = useState(initialClient?.email ?? "");
  const [notes, setNotes] = useState(initialClient?.notes ?? "");
  const [active, setActive] = useState(initialClient?.active ?? true);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFullName = fullName.trim();
    const normalizedEmail = normalizeOptional(email);

    if (normalizedFullName.length < 2) {
      setError(tClients("fullNameValidation"));
      return;
    }

    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      setError(tClients("emailValidation"));
      return;
    }

    setError("");
    await onSubmit({
      fullName: normalizedFullName,
      phone: normalizeOptional(phone),
      email: normalizedEmail,
      notes: normalizeOptional(notes),
      active: initialClient ? active : undefined,
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {initialClient ? tClients("editEyebrow") : tClients("newEyebrow")}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {initialClient ? tClients("editTitle") : tClients("newTitle")}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{tClients("description")}</p>
        </div>
      </div>

      {error ? (
        <ProblemBanner
          problem={{
            title: tClients("validationTitle"),
            detail: error,
            code: "VALIDATION_ERROR",
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="client-full-name">{tClients("fullName")}</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="client-fullName"
          id="client-full-name"
          minLength={2}
          onChange={(event) => setFullName(event.target.value)}
          placeholder={tClients("fullNamePlaceholder")}
          required
          value={fullName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-phone">{tClients("phone")}</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="client-phone"
            id="client-phone"
            onChange={(event) => setPhone(event.target.value)}
            placeholder={tClients("phonePlaceholder")}
            value={phone}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">{tClients("email")}</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="client-email"
            id="client-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={tClients("emailPlaceholder")}
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-notes">{tClients("notes")}</Label>
        <Textarea
          className="min-h-32 rounded-xl"
          data-testid="client-notes"
          id="client-notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder={tClients("notesPlaceholder")}
          rows={5}
          value={notes}
        />
      </div>

      <Separator />

      {initialClient ? (
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm font-medium">
          <Checkbox checked={active} onCheckedChange={(checked) => setActive(Boolean(checked))} />
          <span>{tClients("clientActive")}</span>
        </label>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{tClients("newDefaultActive")}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-11 rounded-xl"
          data-testid="client-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? initialClient
              ? tClients("saving")
              : tClients("creating")
            : initialClient
              ? tClients("update")
              : tClients("create")}
        </Button>
        <Button
          className="h-11 rounded-xl"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          {tClients("cancel")}
        </Button>
      </div>
    </form>
  );
}
