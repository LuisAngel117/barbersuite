"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";

type BranchOption = {
  id: string;
  name: string;
  code: string;
  timeZone: string;
  active: boolean;
};

type BranchSelectorProps = {
  branches: BranchOption[];
  selectedBranchId: string | null;
  variant?: "compact" | "panel";
};

export function BranchSelector({
  branches,
  selectedBranchId,
  variant = "compact",
}: BranchSelectorProps) {
  const router = useRouter();
  const tUi = useTranslations("ui");
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const value = pendingValue ?? selectedBranchId ?? "";
  const selectedBranch = branches.find((branch) => branch.id === value) ?? null;
  const isPanel = variant === "panel";

  async function handleChange(nextBranchId: string) {
    setPendingValue(nextBranchId);
    setError(null);

    const response = await apiFetch("/api/branch/select", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ branchId: nextBranchId }),
    });

    if (!response.ok) {
      setPendingValue(null);
      setError(tUi("branchUpdateFailed"));
      toast.error(tUi("branchUpdateFailed"));
      return;
    }

    toast.success(tUi("branchUpdated"));
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={isPanel ? "space-y-5" : "space-y-3"}>
      {isPanel ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tUi("branchScoped")}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {tUi("availableBranches", { count: branches.filter((branch) => branch.active).length })}
            </Badge>
            {selectedBranch ? (
              <Badge className="rounded-full" variant="secondary">
                {selectedBranch.code}
              </Badge>
            ) : null}
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{tUi("branchActive")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            La selección vive en la cookie <code>bs_branch_id</code> y los Route Handlers la usan
            para enviar <code>X-Branch-Id</code> al backend.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <Label htmlFor="branch-selector">{tUi("branchActive")}</Label>
            <p className="text-xs text-muted-foreground">
              {tUi("branchHint")}
            </p>
          </div>
          {selectedBranch ? (
            <Badge className="rounded-full" variant="secondary">
              {selectedBranch.code}
            </Badge>
          ) : (
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tUi("withoutBranch")}
            </Badge>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="branch-selector">{tUi("branchActive")}</Label>
        <select
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="branch-selector"
          disabled={branches.length === 0 || isPending}
          id="branch-selector"
          onChange={(event) => void handleChange(event.target.value)}
          value={value}
        >
          <option value="" disabled>
            {branches.length === 0 ? tUi("noBranchesAvailable") : tUi("selectBranchOption")}
          </option>
          {branches.map((branch) => (
            <option disabled={!branch.active} key={branch.id} value={branch.id}>
              {branch.code} · {branch.name}
              {branch.active ? "" : " (inactiva)"}
            </option>
          ))}
        </select>
      </div>

      {selectedBranch && isPanel ? (
        <div className="rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm">
          <p className="font-medium">{selectedBranch.name}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedBranch.timeZone} · {selectedBranch.active ? tUi("statusActive") : tUi("statusInactive")}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
