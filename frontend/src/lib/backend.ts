export type ProblemPayload = {
  title?: string;
  detail?: string;
  code?: string;
  error?: string;
};

export type TokenPayload = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type LoginProxyPayload = {
  tenantId?: string;
  email?: string;
  password?: string;
};

export type SignupPayload = {
  tenantName: string;
  branchName: string;
  branchCode: string;
  timeZone: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
};

export type SignupResultPayload = TokenPayload & {
  tenantId: string;
  branchId: string;
  userId: string;
};

export type MePayload = {
  tenant: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
  branches: Array<{
    id: string;
    name: string;
    code: string;
    timeZone: string;
    active: boolean;
  }>;
};

export function buildBackendUrl(path: string) {
  const baseUrl = process.env.BACKEND_BASE_URL;
  if (!baseUrl) {
    throw new Error("BACKEND_BASE_URL is not configured.");
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function readJson<T>(input: Request | Response): Promise<T | null> {
  try {
    return (await input.json()) as T;
  } catch {
    return null;
  }
}

export function resolveErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("detail" in payload && typeof payload.detail === "string" && payload.detail) {
    return payload.detail;
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error) {
    return payload.error;
  }

  if ("title" in payload && typeof payload.title === "string" && payload.title) {
    return payload.title;
  }

  return fallback;
}
