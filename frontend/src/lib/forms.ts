import type { ProblemPayload } from "@/lib/backend";

type ProblemToastMessages = {
  generic: string;
  unauthorized: string;
  forbidden: string;
  branchRequired: string;
  branchForbidden: string;
  conflict: string;
  validation: string;
  csrfRequired?: string;
  csrfFailed?: string;
  originForbidden?: string;
  codes?: Record<string, string>;
};

export function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
}

export function normalizeMoneyInput(value: string | number) {
  const rawValue = typeof value === "number" ? String(value) : value;
  const normalized = rawValue.trim().replace(",", ".");

  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("INVALID_MONEY");
  }

  const numericValue = Number.parseFloat(normalized);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error("INVALID_MONEY");
  }

  return numericValue.toFixed(2);
}

export function toProblemToast(
  problem: ProblemPayload | null,
  messages: ProblemToastMessages,
  fallbackTitle: string,
) {
  const description = (() => {
    if (problem?.code && messages.codes?.[problem.code]) {
      return messages.codes[problem.code];
    }

    switch (problem?.code) {
      case "UNAUTHORIZED":
        return messages.unauthorized;
      case "FORBIDDEN":
        return messages.forbidden;
      case "BRANCH_REQUIRED":
        return messages.branchRequired;
      case "BRANCH_FORBIDDEN":
        return messages.branchForbidden;
      case "CONFLICT":
        return messages.conflict;
      case "VALIDATION_ERROR":
        return messages.validation;
      case "CSRF_REQUIRED":
        return messages.csrfRequired || messages.validation;
      case "CSRF_FAILED":
        return messages.csrfFailed || messages.validation;
      case "ORIGIN_FORBIDDEN":
        return messages.originForbidden || messages.forbidden;
      default:
        return problem?.detail || problem?.error || problem?.title || messages.generic;
    }
  })();

  return {
    title: problem?.title || fallbackTitle,
    description,
  };
}
