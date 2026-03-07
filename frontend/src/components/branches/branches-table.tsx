"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { hasAnyRole } from "@/lib/roles";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import type { Branch } from "@/lib/types/branches";
import { BranchForm } from "@/components/branches/branch-form";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProblemBanner } from "@/components/ui/problem-banner";

const DEFAULT_PAGE_SIZE = 10;

type BranchesTableProps = {
  roles: readonly string[];
};

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function BranchesTable({ roles }: BranchesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tBranches = useTranslations("branches");
  const tCommon = useTranslations("common");
  const tConfirmations = useTranslations("confirmations");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const canManageBranches = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const isSheetOpen = formMode !== null;
  const query = queryInput.trim().toLowerCase();

  const fetchBranches = useCallback(async () => {
    const response = await fetch("/api/branches", {
      cache: "no-store",
    });
    const result = await readApiResponse<Branch[]>(response);

    if (!response.ok || !result.data) {
      setBranches([]);
      setProblem(toProblemBanner(result.problem, tBranches("loadFailed")));
      setIsLoading(false);
      return;
    }

    setBranches(result.data);
    setProblem(null);
    setIsLoading(false);
  }, [tBranches]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBranches();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBranches]);

  useEffect(() => {
    if (searchParams.get("create") !== "1" || isSheetOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEditingBranch(null);
      setFormMode("create");
      setProblem(null);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("create");
      const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isSheetOpen, pathname, router, searchParams]);

  const reloadBranches = useCallback(async () => {
    setIsLoading(true);
    await fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = useMemo(() => {
    if (!query) {
      return branches;
    }

    return branches.filter((branch) =>
      [branch.name, branch.code, branch.timeZone].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [branches, query]);

  const openEditBranch = useCallback(
    async (branchId: string) => {
      setPendingBranchId(branchId);
      setProblem(null);

      const response = await fetch(`/api/branches/${branchId}`, {
        cache: "no-store",
      });
      const result = await readApiResponse<Branch>(response);

      setPendingBranchId(null);
      if (!response.ok || !result.data) {
        setProblem(toProblemBanner(result.problem, tBranches("loadOneFailed")));
        return;
      }

      setEditingBranch(result.data);
      setFormMode("edit");
    },
    [tBranches],
  );

  const handleToggleActive = useCallback(
    async (branch: Branch) => {
      setPendingBranchId(branch.id);
      setProblem(null);

      const response = await apiFetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          active: !branch.active,
        }),
      });
      const result = await readApiResponse<Branch>(response);

      setPendingBranchId(null);
      if (!response.ok) {
        setProblem(toProblemBanner(result.problem, tBranches("toggleFailed")));
        return;
      }

      toast.success(branch.active ? tBranches("toasts.deactivated") : tBranches("toasts.activated"));
      await reloadBranches();
      router.refresh();
    },
    [reloadBranches, router, tBranches],
  );

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => {
      const baseColumns: ColumnDef<Branch>[] = [
        {
          accessorKey: "name",
          header: tBranches("fields.name"),
          cell: ({ row }) => <span className="font-medium tracking-tight">{row.original.name}</span>,
        },
        {
          accessorKey: "code",
          header: tBranches("fields.code"),
          cell: ({ row }) => (
            <Badge className="rounded-full" variant="outline">
              {row.original.code}
            </Badge>
          ),
        },
        {
          accessorKey: "timeZone",
          header: tBranches("fields.timeZone"),
          cell: ({ row }) => row.original.timeZone,
        },
        {
          accessorKey: "active",
          header: tBranches("fields.active"),
          cell: ({ row }) => (
            <Badge className="rounded-full" variant={row.original.active ? "secondary" : "outline"}>
              {row.original.active ? tBranches("active") : tBranches("inactive")}
            </Badge>
          ),
        },
      ];

      if (!canManageBranches) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          id: "actions",
          header: tCommon("actions"),
          cell: ({ row }) => {
            const branch = row.original;
            const segment = toTestIdSegment(branch.name);
            const isPending = pendingBranchId === branch.id;

            return (
              <DataTableRowActions
                actions={[
                  {
                    label: isPending ? tCommon("loading") : tCommon("edit"),
                    onClick: () => openEditBranch(branch.id),
                    disabled: isPending,
                    testId: `branches-edit-${segment}`,
                  },
                  {
                    label: isPending
                      ? tCommon("loading")
                      : branch.active
                        ? tBranches("actions.deactivate")
                        : tBranches("actions.activate"),
                    onClick: () => handleToggleActive(branch),
                    destructive: true,
                    disabled: isPending,
                    confirmTitle: branch.active
                      ? tConfirmations("deactivateTitle")
                      : tConfirmations("activateTitle"),
                    confirmDescription: branch.active
                      ? tConfirmations("deactivateDescription")
                      : tConfirmations("activateDescription"),
                    confirmLabel: branch.active
                      ? tBranches("actions.deactivate")
                      : tBranches("actions.activate"),
                    testId: `branches-toggle-${segment}`,
                  },
                ]}
                triggerTestId={`branches-actions-${segment}`}
              />
            );
          },
        },
      ];
    },
    [
      canManageBranches,
      handleToggleActive,
      openEditBranch,
      pendingBranchId,
      tBranches,
      tCommon,
      tConfirmations,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tBranches("count", { count: filteredBranches.length })}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {tBranches("tenantScoped")}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tBranches("description")}</p>
        </div>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <DataTable
        columns={columns}
        data={filteredBranches}
        emptyCta={
          canManageBranches ? (
            <Button asChild className="rounded-full" type="button">
              <Link href="/app/branches?create=1">{tBranches("newBranch")}</Link>
            </Button>
          ) : null
        }
        emptyDescription={query ? tBranches("searchEmptyDescription") : tBranches("emptyDescription")}
        emptyTitle={query ? tBranches("searchEmptyTitle") : tBranches("emptyTitle")}
        globalFilter={{
          value: queryInput,
          onChange: (value) => {
            setQueryInput(value);
            setPagination((current) =>
              current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
            );
          },
          placeholder: tBranches("searchPlaceholder"),
          testId: "branches-search",
        }}
        isLoading={isLoading}
        pagination={{
          mode: "client",
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalItems: filteredBranches.length,
          onPaginationChange: setPagination,
        }}
        rightSlot={
          canManageBranches ? (
            <Button asChild className="rounded-xl" data-testid="branches-add" type="button">
              <Link href="/app/branches?create=1">{tBranches("newBranch")}</Link>
            </Button>
          ) : null
        }
        rowId={(branch) => branch.id}
        rowTestId={(branch) => `branches-row-${toTestIdSegment(branch.name)}`}
        sorting={{
          sortingState: sorting,
          onSortingChange: setSorting,
        }}
        title={tBranches("listTitle")}
      />

      {isSheetOpen ? (
        <BranchForm
          initialBranch={editingBranch}
          key={`${formMode}-${editingBranch?.id ?? "new-branch"}`}
          mode={formMode === "edit" ? "edit" : "create"}
          onOpenChange={(open) => {
            if (!open) {
              setFormMode(null);
              setEditingBranch(null);
            }
          }}
          onSuccess={async () => {
            await reloadBranches();
            router.refresh();
          }}
          open
        />
      ) : null}
    </div>
  );
}
