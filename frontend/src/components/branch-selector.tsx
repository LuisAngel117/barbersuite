"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
};

export function BranchSelector({
  branches,
  selectedBranchId,
}: BranchSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const value = pendingValue ?? selectedBranchId ?? "";

  async function handleChange(nextBranchId: string) {
    setPendingValue(nextBranchId);
    setError(null);

    const response = await fetch("/api/branch/select", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ branchId: nextBranchId }),
    });

    if (!response.ok) {
      setPendingValue(null);
      setError("No pudimos guardar la sucursal seleccionada.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="branch-selector stack">
      <div className="dashboard-heading">
        <span className="eyebrow">Sucursal activa</span>
        <h1>Contexto branch-scoped</h1>
        <p className="muted">
          La selección vive en la cookie <code>bs_branch_id</code> y los Route Handlers la usan
          para enviar <code>X-Branch-Id</code> al backend.
        </p>
      </div>

      <div className="field">
        <label htmlFor="branch-selector">Sucursal</label>
        <select
          id="branch-selector"
          className="branch-selector-input"
          data-testid="branch-selector"
          disabled={branches.length === 0 || isPending}
          value={value}
          onChange={(event) => void handleChange(event.target.value)}
        >
          <option value="" disabled>
            {branches.length === 0 ? "No hay sucursales disponibles" : "Selecciona una sucursal"}
          </option>
          {branches.map((branch) => (
            <option disabled={!branch.active} key={branch.id} value={branch.id}>
              {branch.code} · {branch.name}
              {branch.active ? "" : " (inactiva)"}
            </option>
          ))}
        </select>
      </div>

      <div className="meta-row">
        <span className="soft-pill">
          {branches.filter((branch) => branch.active).length} activas
        </span>
        {value ? <span className="soft-pill">{value}</span> : null}
      </div>

      {error ? <p className="alert">{error}</p> : null}
    </div>
  );
}
