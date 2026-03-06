"use client";

import type { FormEventHandler, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type EntitySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  cancelLabel: string;
  submitLabel: string;
  submitTestId?: string;
  hideSubmit?: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function EntitySheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel,
  submitLabel,
  submitTestId,
  hideSubmit = false,
  submitting,
  onCancel,
  onSubmit,
}: EntitySheetProps) {
  return (
    <Sheet
      onOpenChange={(nextOpen) => {
        if (submitting && !nextOpen) {
          return;
        }

        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <SheetContent className="w-full border-border/70 bg-background/98 p-0 sm:max-w-xl">
        <form aria-busy={submitting} className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
          <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
            <SheetTitle className="text-xl tracking-tight">{title}</SheetTitle>
            <SheetDescription className="text-sm leading-6">{description}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          <SheetFooter className="sticky bottom-0 border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:justify-between">
            <Button disabled={submitting} onClick={onCancel} type="button" variant="outline">
              {cancelLabel}
            </Button>
            {!hideSubmit ? (
              <Button data-testid={submitTestId} disabled={submitting} type="submit">
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            ) : null}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
