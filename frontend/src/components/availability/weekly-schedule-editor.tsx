"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WeeklyInterval } from "@/lib/types/availability";
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

type WeeklyScheduleEditorProps = {
  weekly: WeeklyInterval[];
  issues: Map<string, string>;
  showErrors: boolean;
  onAddInterval: (dayOfWeek: number) => void;
  onChangeInterval: (
    dayOfWeek: number,
    intervalIndex: number,
    field: "start" | "end",
    value: string,
  ) => void;
  onRemoveInterval: (dayOfWeek: number, intervalIndex: number) => void;
};

const DAYS = [
  { dayOfWeek: 1, labelKey: "days.mon" },
  { dayOfWeek: 2, labelKey: "days.tue" },
  { dayOfWeek: 3, labelKey: "days.wed" },
  { dayOfWeek: 4, labelKey: "days.thu" },
  { dayOfWeek: 5, labelKey: "days.fri" },
  { dayOfWeek: 6, labelKey: "days.sat" },
  { dayOfWeek: 7, labelKey: "days.sun" },
] as const;

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

export function WeeklyScheduleEditor({
  weekly,
  issues,
  showErrors,
  onAddInterval,
  onChangeInterval,
  onRemoveInterval,
}: WeeklyScheduleEditorProps) {
  const tAvailability = useTranslations("availability");

  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-lg shadow-black/5">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{tAvailability("weeklyTitle")}</CardTitle>
          <CardDescription>{tAvailability("weeklyDescription")}</CardDescription>
        </div>
        <Badge className="rounded-full" variant="outline">
          {tAvailability("intervalsCount", { count: weekly.length })}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {DAYS.map((day) => {
          const dayIntervals = weekly
            .map((interval, index) => ({ ...interval, index }))
            .filter((interval) => interval.dayOfWeek === day.dayOfWeek);
          const dayIssue = showErrors
            ? findIssue(issues, dayIntervals.map((interval) => `weekly.${interval.index}`))
            : null;

          return (
            <div
              className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
              key={day.dayOfWeek}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium tracking-tight">{tAvailability(day.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">
                    {tAvailability("intervalsForDay")}
                  </p>
                </div>
                <Button
                  className="rounded-full"
                  data-testid={`availability-day-${day.dayOfWeek}-add`}
                  onClick={() => onAddInterval(day.dayOfWeek)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                  {tAvailability("addInterval")}
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {dayIntervals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{tAvailability("noIntervals")}</p>
                    <p className="mt-1 leading-6">{tAvailability("noIntervalsDescription")}</p>
                  </div>
                ) : (
                  dayIntervals.map((interval, intervalIndex) => {
                    const startIssue = showErrors
                      ? findIssue(issues, [`weekly.${interval.index}.start`])
                      : null;
                    const endIssue = showErrors
                      ? findIssue(issues, [`weekly.${interval.index}.end`])
                      : null;

                    return (
                      <div
                        className="rounded-2xl border border-border/70 bg-card/80 p-3"
                        key={`${day.dayOfWeek}-${interval.index}`}
                      >
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                          <div className="space-y-2">
                            <label
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                              htmlFor={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-start`}
                            >
                              {tAvailability("fields.start")}
                            </label>
                            <Input
                              aria-invalid={Boolean(startIssue)}
                              data-testid={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-start`}
                              id={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-start`}
                              onChange={(event) =>
                                onChangeInterval(day.dayOfWeek, intervalIndex, "start", event.target.value)
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
                              htmlFor={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-end`}
                            >
                              {tAvailability("fields.end")}
                            </label>
                            <Input
                              aria-invalid={Boolean(endIssue)}
                              data-testid={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-end`}
                              id={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-end`}
                              onChange={(event) =>
                                onChangeInterval(day.dayOfWeek, intervalIndex, "end", event.target.value)
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
                              data-testid={`availability-weekly-${day.dayOfWeek}-${intervalIndex}-remove`}
                              onClick={() => onRemoveInterval(day.dayOfWeek, intervalIndex)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {dayIssue ? <p className="text-xs text-destructive">{dayIssue}</p> : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
