import {
  readJson,
  resolveErrorMessage,
  type ProblemPayload,
} from "@/lib/backend";

export type ProblemBannerState = {
  title: string;
  detail: string;
  code?: string;
};

function isProblemPayload(payload: unknown): payload is ProblemPayload {
  return Boolean(payload && typeof payload === "object");
}

export async function readApiResponse<T>(response: Response) {
  const payload = await readJson<T | ProblemPayload>(response);

  if (response.ok) {
    return {
      data: payload as T | null,
      problem: null,
    };
  }

  return {
    data: null,
    problem: isProblemPayload(payload) ? payload : null,
  };
}

export function problemMessage(problem: ProblemPayload | null, fallback: string) {
  switch (problem?.code) {
    case "CSRF_REQUIRED":
      return "Tu sesión requiere un token CSRF válido para completar esta acción. Recarga la página e inténtalo de nuevo.";
    case "CSRF_FAILED":
      return "No pudimos validar la seguridad de la acción. Recarga la página y vuelve a intentarlo.";
    case "ORIGIN_FORBIDDEN":
      return "La acción fue bloqueada porque el origen del request no coincide con la aplicación actual.";
    case "BRANCH_REQUIRED":
      return "Selecciona una sucursal arriba para continuar.";
    case "BRANCH_FORBIDDEN":
      return "No tienes acceso a la sucursal seleccionada. Cambia de sucursal para continuar.";
    case "FORBIDDEN":
      return "No tienes permisos para realizar esta acción. Si necesitas operar este módulo, vuelve a entrar con una cuenta ADMIN, MANAGER o RECEPTION según corresponda.";
    case "UNAUTHORIZED":
      return "Tu sesión ya no es válida. Vuelve a iniciar sesión.";
    default:
      return resolveErrorMessage(problem, fallback);
  }
}

export function toProblemBanner(
  problem: ProblemPayload | null,
  fallback: string,
): ProblemBannerState {
  return {
    title: problem?.title || "No pudimos completar la acción",
    detail: problemMessage(problem, fallback),
    code: problem?.code,
  };
}
