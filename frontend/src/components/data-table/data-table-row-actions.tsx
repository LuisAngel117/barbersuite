"use client";

import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DestructiveConfirm } from "@/components/ui/destructive-confirm";

export type DataTableRowAction = {
  label: string;
  onClick: () => Promise<void> | void;
  destructive?: boolean;
  disabled?: boolean;
  testId?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
};

type DataTableRowActionsProps = {
  actions: DataTableRowAction[];
  triggerLabel?: string;
  triggerTestId?: string;
};

export function DataTableRowActions({
  actions,
  triggerLabel,
  triggerTestId,
}: DataTableRowActionsProps) {
  const tCommon = useTranslations("common");
  const [confirmAction, setConfirmAction] = useState<DataTableRowAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const enabledActionCount = useMemo(
    () => actions.filter((action) => !action.disabled).length,
    [actions],
  );

  if (actions.length === 0) {
    return null;
  }

  async function runAction(action: DataTableRowAction) {
    setIsRunning(true);
    try {
      await action.onClick();
    } finally {
      setIsRunning(false);
      setConfirmAction(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={triggerLabel || tCommon("actions")}
            className="size-9 rounded-xl"
            data-testid={triggerTestId}
            disabled={enabledActionCount === 0}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          {actions.map((action, index) => (
            <div key={`${action.label}-${index}`}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                disabled={action.disabled || isRunning}
                data-testid={action.testId}
                onSelect={(event) => {
                  if (action.disabled || isRunning) {
                    event.preventDefault();
                    return;
                  }

                  if (action.destructive) {
                    event.preventDefault();
                    setConfirmAction(action);
                    return;
                  }

                  void runAction(action);
                }}
                variant={action.destructive ? "destructive" : "default"}
              >
                {action.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DestructiveConfirm
        cancelLabel={tCommon("cancel")}
        confirmLabel={confirmAction?.confirmLabel || tCommon("confirm")}
        confirmTestId={confirmAction?.testId ? `${confirmAction.testId}-confirm` : undefined}
        description={
          confirmAction?.confirmDescription || `${confirmAction?.label || tCommon("confirm")}.`
        }
        onConfirm={async () => {
          if (!confirmAction) {
            return;
          }

          await runAction(confirmAction);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
        open={Boolean(confirmAction)}
        pending={isRunning}
        title={confirmAction?.confirmTitle || tCommon("confirm")}
      />
    </>
  );
}
