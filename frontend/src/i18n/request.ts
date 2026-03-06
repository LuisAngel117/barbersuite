import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
