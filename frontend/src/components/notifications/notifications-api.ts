import { apiFetch } from "@/lib/api-client";
import { readApiResponse } from "@/lib/problem";
import type {
  EmailOutboxPage,
  SendTestEmailRequest,
  SendTestEmailResponse,
} from "@/lib/types/notifications";

function toQueryString(params: URLSearchParams | string) {
  const search = typeof params === "string" ? params : params.toString();
  return search ? `?${search}` : "";
}

export async function fetchEmailOutbox(params: URLSearchParams | string) {
  const response = await fetch(`/api/notifications/email/outbox${toQueryString(params)}`, {
    cache: "no-store",
  });
  const result = await readApiResponse<EmailOutboxPage>(response);

  return {
    status: response.status,
    ...result,
  };
}

export async function enqueueTestEmail(payload: SendTestEmailRequest) {
  const response = await apiFetch("/api/notifications/email/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await readApiResponse<SendTestEmailResponse>(response);

  return {
    status: response.status,
    ...result,
  };
}
