"use client";

import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DestructiveConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void> | void;
  pending?: boolean;
  confirmTestId?: string;
};

export function DestructiveConfirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  confirmTestId,
}: DestructiveConfirmProps) {
  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (pending && !nextOpen) {
          return;
        }

        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <AlertDialogContent className="rounded-[1.5rem] border-border/70">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            data-testid={confirmTestId}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            variant="destructive"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
