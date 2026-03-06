"use client";

import type { ServicePayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { readApiResponse } from "@/lib/problem";
import type {
  CreateReceiptRequest,
  Receipt,
  ReceiptPage,
  VoidReceiptRequest,
} from "@/lib/types/receipts";

type ApiResult<T> = {
  data: T | null;
  problem: Awaited<ReturnType<typeof readApiResponse<T>>>["problem"];
  status: number;
};

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  const result = await readApiResponse<T>(response);

  return {
    data: result.data,
    problem: result.problem,
    status: response.status,
  };
}

export async function fetchReceipts(params: URLSearchParams) {
  const response = await fetch(`/api/receipts?${params.toString()}`, {
    cache: "no-store",
  });
  return parseResponse<ReceiptPage>(response);
}

export async function fetchReceipt(receiptId: string) {
  const response = await fetch(`/api/receipts/${receiptId}`, {
    cache: "no-store",
  });
  return parseResponse<Receipt>(response);
}

export async function createReceipt(payload: CreateReceiptRequest) {
  const response = await apiFetch("/api/receipts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<Receipt>(response);
}

export async function voidReceipt(receiptId: string, payload: VoidReceiptRequest) {
  const response = await apiFetch(`/api/receipts/${receiptId}/void`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<Receipt>(response);
}

export async function fetchReceiptServices() {
  const response = await fetch("/api/services", {
    cache: "no-store",
  });
  return parseResponse<ServicePayload[]>(response);
}
