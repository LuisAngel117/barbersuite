"use client";

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

type DataTableEmptyProps = {
  title: string;
  description: string;
  cta?: ReactNode;
};

export function DataTableEmpty({ title, description, cta }: DataTableEmptyProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <strong className="mt-4 text-lg font-semibold tracking-tight">{title}</strong>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {cta ? <div className="mt-5">{cta}</div> : null}
    </div>
  );
}
