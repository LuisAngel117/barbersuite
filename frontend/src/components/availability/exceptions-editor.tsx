"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AvailabilityException } from "@/lib/types/availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExceptionsEditorProps = {
  exceptions: AvailabilityException[];
  issues: Map<string, string>;
  showErrors: boolean;
  onAddException: () => void;
  onRemoveException: (exceptionIndex: number) => void;
  onChangeException: (
    exceptionIndex: number,
    field: "date" | "type" | "note",
    value: string,
  ) => void;
  onAddInterval: (exceptionIndex: number) => void;
  onRemoveInterval: (exceptionIndex: number, intervalIndex: number) => void;
  onChangeInterval: (
    exceptionIndex: number,
    intervalIndex: number,
    field: "start" | "end",
    value: string,
  ) => void;
};

function findIssue(issues: Map<string, string>, prefixes: string[]) {
  for (const prefix of prefixes) {
    const direct = issues.get(prefix);
    if (direct) {
      return direct;
    }

    const nested = [...issues.entries()].find(
      ([key]) => key === prefix || key.startsWith(`${prefix}.`),
    );
    if (nested) {
      return nested[1];
    }
  }

  return null;
}

export function ExceptionsEditor({
  exceptions,
  issues,
  showErrors,
  onAddException,
  onRemoveException,
  onChangeException,
  onAddInterval,
  onRemoveInterval,
  onChangeInterval,
}: ExceptionsEditorProps) {
  const tAvailability = useTranslations("availability");

  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-lg shadow-black/5">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{tAvailability("exceptionsTitle")}</CardTitle>
          <CardDescription>{tAvailability("exceptionsDescription")}</CardDescription>
        </div>
        <Button
          className="rounded-full"
          data-testid="availability-add-exception"
          onClick={onAddException}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          {tAvailability("addException")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {exceptions.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-border/70 px-5 py-8 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{tAvailability("noExceptionsTitle")}</p>
            <p className="mt-1 leading-6">{tAvailability("noExceptionsDescription")}</p>
          </div>
        ) : (
          exceptions.map((exception, exceptionIndex) => {
            const dateIssue = showErrors
              ? findIssue(issues, [`exceptions.${exceptionIndex}.date`])
              : null;
            const typeIssue = showErrors
              ? findIssue(issues, [`exceptions.${exceptionIndex}.type`])
              : null;
            const intervalsIssue = showErrors
              ? findIssue(issues, [`exceptions.${exceptionIndex}.intervals`])
              : null;

            return (
              <div
                className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
                data-testid={`availability-exception-${exceptionIndex}`}
                key={`${exception.date}-${exceptionIndex}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium tracking-tight">
                        {tAvailability("exceptionLabel", { index: exceptionIndex + 1 })}
                      </p>
                      <Badge className="rounded-full" variant="outline">
                        {tAvailability(`type.${exception.type}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tAvailability("exceptionHint")}
                    </p>
                  </div>
                  <Button
                    className="rounded-full"
                    data-testid={`availability-exception-${exceptionIndex}-remove`}
                    onClick={() => onRemoveException(exceptionIndex)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      htmlFor={`availability-exception-${exceptionIndex}-date`}
                    >
                      {tAvailability("fields.date")}
                    </label>
                    <Input
                      aria-invalid={Boolean(dateIssue)}
                      data-testid={`availability-exception-${exceptionIndex}-date`}
                      id={`availability-exception-${exceptionIndex}-date`}
                      onChange={(event) =>
                        onChangeException(exceptionIndex, "date", event.target.value)
                      }
                      type="date"
                      value={exception.date}
                    />
                    {dateIssue ? <p className="text-xs text-destructive">{dateIssue}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      htmlFor={`availability-exception-${exceptionIndex}-type`}
                    >
                      {tAvailability("fields.type")}
                    </label>
                    <Select
                      onValueChange={(value) => onChangeException(exceptionIndex, "type", value)}
                      value={exception.type}
                    >
                      <SelectTrigger
                        className="h-10 w-full rounded-xl"
                        data-testid={`availability-exception-${exceptionIndex}-type`}
                        id={`availability-exception-${exceptionIndex}-type`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="closed">{tAvailability("type.closed")}</SelectItem>
                        <SelectItem value="override">{tAvailability("type.override")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {typeIssue ? <p className="text-xs text-destructive">{typeIssue}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      htmlFor={`availability-exception-${exceptionIndex}-note`}
                    >
                      {tAvailability("fields.note")}
                    </label>
                    <Input
                      data-testid={`availability-exception-${exceptionIndex}-note`}
                      id={`availability-exception-${exceptionIndex}-note`}
                      onChange={(event) =>
                        onChangeException(exceptionIndex, "note", event.target.value)
                      }
                      placeholder={tAvailability("notePlaceholder")}
                      value={exception.note ?? ""}
                    />
                  </div>
                </div>

                {exception.type === "override" ? (
                  <div className="mt-5 space-y-3 rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium tracking-tight">
                          {tAvailability("overrideIntervalsTitle")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tAvailability("overrideIntervalsDescription")}
                        </p>
                      </div>
                      <Button
                        className="rounded-full"
                        data-testid={`availability-exception-${exceptionIndex}-add-interval`}
                        onClick={() => onAddInterval(exceptionIndex)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="size-4" />
                        {tAvailability("addInterval")}
                      </Button>
                    </div>

                    {exception.intervals?.map((interval, intervalIndex) => {
                      const startIssue = showErrors
                        ? findIssue(issues, [`exceptions.${exceptionIndex}.intervals.${intervalIndex}.start`])
                        : null;
                      const endIssue = showErrors
                        ? findIssue(issues, [`exceptions.${exceptionIndex}.intervals.${intervalIndex}.end`])
                        : null;

                      return (
                        <div
                          className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                          key={`${exceptionIndex}-${intervalIndex}`}
                        >
                          <div className="space-y-2">
                            <label
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                              htmlFor={`availability-exception-${exceptionIndex}-${intervalIndex}-start`}
                            >
                              {tAvailability("fields.start")}
                            </label>
                            <Input
                              aria-invalid={Boolean(startIssue)}
                              data-testid={`availability-exception-${exceptionIndex}-${intervalIndex}-start`}
                              id={`availability-exception-${exceptionIndex}-${intervalIndex}-start`}
                              onChange={(event) =>
                                onChangeInterval(exceptionIndex, intervalIndex, "start", event.target.value)
                              }
                              type="time"
                              value={interval.start}
                            />
                            {startIssue ? (
                              <p className="text-xs text-destructive">{startIssue}</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <label
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                              htmlFor={`availability-exception-${exceptionIndex}-${intervalIndex}-end`}
                            >
                              {tAvailability("fields.end")}
                            </label>
                            <Input
                              aria-invalid={Boolean(endIssue)}
                              data-testid={`availability-exception-${exceptionIndex}-${intervalIndex}-end`}
                              id={`availability-exception-${exceptionIndex}-${intervalIndex}-end`}
                              onChange={(event) =>
                                onChangeInterval(exceptionIndex, intervalIndex, "end", event.target.value)
                              }
                              type="time"
                              value={interval.end}
                            />
                            {endIssue ? (
                              <p className="text-xs text-destructive">{endIssue}</p>
                            ) : null}
                          </div>

                          <div className="flex items-end justify-end pt-6">
                            <Button
                              className="rounded-full"
                              data-testid={`availability-exception-${exceptionIndex}-${intervalIndex}-remove`}
                              onClick={() => onRemoveInterval(exceptionIndex, intervalIndex)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {intervalsIssue ? (
                      <p className="text-xs text-destructive">{intervalsIssue}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
