import { z, type ZodIssue } from "zod";
import type {
  AvailabilityException,
  AvailabilityExceptionInterval,
  PutAvailabilityRequest,
  WeeklyInterval,
} from "@/lib/types/availability";

type AvailabilitySchemaMessages = {
  timeFormat: string;
  startBeforeEnd: string;
  dayOfWeek: string;
  weeklyOverlap: string;
  exceptionDate: string;
  duplicateExceptionDate: string;
  closedWithIntervals: string;
  overrideNeedsIntervals: string;
  exceptionOverlap: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type AvailabilityFormValues = PutAvailabilityRequest;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((segment) => Number.parseInt(segment, 10));
  return (hours * 60) + minutes;
}

const weeklyIntervalSchema = z.object({
  dayOfWeek: z.number().int(),
  start: z.string(),
  end: z.string(),
});

const exceptionIntervalSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const availabilityExceptionSchema = z.object({
  date: z.string(),
  type: z.enum(["closed", "override"]),
  note: z.string().optional(),
  intervals: z.array(exceptionIntervalSchema).optional().default([]),
});

export function createAvailabilitySchema(messages: AvailabilitySchemaMessages) {
  return z.object({
    weekly: z.array(weeklyIntervalSchema),
    exceptions: z.array(availabilityExceptionSchema),
  }).superRefine((value, context) => {
    value.weekly.forEach((interval, index) => {
      if (interval.dayOfWeek < 1 || interval.dayOfWeek > 7) {
        context.addIssue({
          code: "custom",
          message: messages.dayOfWeek,
          path: ["weekly", index, "dayOfWeek"],
        });
      }

      if (!TIME_PATTERN.test(interval.start)) {
        context.addIssue({
          code: "custom",
          message: messages.timeFormat,
          path: ["weekly", index, "start"],
        });
      }

      if (!TIME_PATTERN.test(interval.end)) {
        context.addIssue({
          code: "custom",
          message: messages.timeFormat,
          path: ["weekly", index, "end"],
        });
      }

      if (
        TIME_PATTERN.test(interval.start) &&
        TIME_PATTERN.test(interval.end) &&
        timeToMinutes(interval.start) >= timeToMinutes(interval.end)
      ) {
        context.addIssue({
          code: "custom",
          message: messages.startBeforeEnd,
          path: ["weekly", index, "end"],
        });
      }
    });

    for (let day = 1; day <= 7; day += 1) {
      const intervalsForDay = value.weekly
        .map((interval, index) => ({ ...interval, index }))
        .filter((interval) => interval.dayOfWeek === day && TIME_PATTERN.test(interval.start) && TIME_PATTERN.test(interval.end))
        .sort((left, right) => timeToMinutes(left.start) - timeToMinutes(right.start));

      for (let index = 1; index < intervalsForDay.length; index += 1) {
        const previous = intervalsForDay[index - 1]!;
        const current = intervalsForDay[index]!;
        if (timeToMinutes(current.start) < timeToMinutes(previous.end)) {
          context.addIssue({
            code: "custom",
            message: messages.weeklyOverlap,
            path: ["weekly", current.index, "start"],
          });
        }
      }
    }

    const seenExceptionDates = new Map<string, number>();
    value.exceptions.forEach((exception, exceptionIndex) => {
      if (!DATE_PATTERN.test(exception.date)) {
        context.addIssue({
          code: "custom",
          message: messages.exceptionDate,
          path: ["exceptions", exceptionIndex, "date"],
        });
      }

      if (DATE_PATTERN.test(exception.date)) {
        const previousIndex = seenExceptionDates.get(exception.date);
        if (previousIndex !== undefined) {
          context.addIssue({
            code: "custom",
            message: messages.duplicateExceptionDate,
            path: ["exceptions", exceptionIndex, "date"],
          });
        } else {
          seenExceptionDates.set(exception.date, exceptionIndex);
        }
      }

      const intervals = exception.intervals ?? [];
      if (exception.type === "closed" && intervals.length > 0) {
        context.addIssue({
          code: "custom",
          message: messages.closedWithIntervals,
          path: ["exceptions", exceptionIndex, "intervals"],
        });
      }

      if (exception.type === "override" && intervals.length === 0) {
        context.addIssue({
          code: "custom",
          message: messages.overrideNeedsIntervals,
          path: ["exceptions", exceptionIndex, "intervals"],
        });
      }

      intervals.forEach((interval, intervalIndex) => {
        if (!TIME_PATTERN.test(interval.start)) {
          context.addIssue({
            code: "custom",
            message: messages.timeFormat,
            path: ["exceptions", exceptionIndex, "intervals", intervalIndex, "start"],
          });
        }

        if (!TIME_PATTERN.test(interval.end)) {
          context.addIssue({
            code: "custom",
            message: messages.timeFormat,
            path: ["exceptions", exceptionIndex, "intervals", intervalIndex, "end"],
          });
        }

        if (
          TIME_PATTERN.test(interval.start) &&
          TIME_PATTERN.test(interval.end) &&
          timeToMinutes(interval.start) >= timeToMinutes(interval.end)
        ) {
          context.addIssue({
            code: "custom",
            message: messages.startBeforeEnd,
            path: ["exceptions", exceptionIndex, "intervals", intervalIndex, "end"],
          });
        }
      });

      const validIntervals = intervals
        .map((interval, intervalIndex) => ({ ...interval, intervalIndex }))
        .filter((interval) => TIME_PATTERN.test(interval.start) && TIME_PATTERN.test(interval.end))
        .sort((left, right) => timeToMinutes(left.start) - timeToMinutes(right.start));

      for (let intervalIndex = 1; intervalIndex < validIntervals.length; intervalIndex += 1) {
        const previous = validIntervals[intervalIndex - 1]!;
        const current = validIntervals[intervalIndex]!;
        if (timeToMinutes(current.start) < timeToMinutes(previous.end)) {
          context.addIssue({
            code: "custom",
            message: messages.exceptionOverlap,
            path: ["exceptions", exceptionIndex, "intervals", current.intervalIndex, "start"],
          });
        }
      }
    });
  });
}

export function normalizeAvailabilityPayload(values: PutAvailabilityRequest): PutAvailabilityRequest {
  const weekly = values.weekly.map((interval) => ({
    dayOfWeek: interval.dayOfWeek,
    start: interval.start,
    end: interval.end,
  }));

  const exceptions = values.exceptions.map((exception) => ({
    date: exception.date,
    type: exception.type,
    note: exception.note?.trim() ? exception.note.trim() : undefined,
    intervals: exception.type === "override"
      ? (exception.intervals ?? []).map((interval) => ({
          start: interval.start,
          end: interval.end,
        }))
      : [],
  }));

  return {
    weekly,
    exceptions,
  };
}

export function createAvailabilityIssueMap(issues: ZodIssue[]) {
  const issueMap = new Map<string, string>();
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (key && !issueMap.has(key)) {
      issueMap.set(key, issue.message);
    }
  }
  return issueMap;
}

export function createEmptyWeeklyInterval(dayOfWeek: number): WeeklyInterval {
  return {
    dayOfWeek,
    start: "09:00",
    end: "18:00",
  };
}

export function createEmptyExceptionInterval(): AvailabilityExceptionInterval {
  return {
    start: "09:00",
    end: "18:00",
  };
}

export function createEmptyAvailabilityException(): AvailabilityException {
  return {
    date: "",
    type: "closed",
    note: "",
    intervals: [],
  };
}
