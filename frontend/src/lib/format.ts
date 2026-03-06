type TranslateFn = (key: string) => string;

export function formatMoneyUSD(amount: number | string, locale = "en-US") {
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (!Number.isFinite(numericAmount)) {
    return "0.00";
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

export function formatBooleanActive(active: boolean, translate?: TranslateFn) {
  if (!translate) {
    return active ? "active" : "inactive";
  }

  return active ? translate("active") : translate("statusInactive");
}
