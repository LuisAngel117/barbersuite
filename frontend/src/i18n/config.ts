export const LOCALE_COOKIE = "bs_locale";
export const DEFAULT_LOCALE = "es";
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export const LOCALE_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  if (!value) {
    return false;
  }

  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
