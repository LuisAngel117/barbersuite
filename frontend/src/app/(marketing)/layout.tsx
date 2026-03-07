import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.meta");

  return {
    metadataBase: new URL("https://barbersuite.app"),
    title: {
      default: t("defaultTitle"),
      template: "%s | BarberSuite",
    },
    description: t("description"),
    keywords: [
      "barbershop software",
      "barber shop saas",
      "barber agenda",
      "barber receipts",
      "barber reports",
      "multi-branch barbershop",
    ],
    openGraph: {
      type: "website",
      siteName: "BarberSuite",
      title: t("defaultTitle"),
      description: t("description"),
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "BarberSuite marketing image",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("description"),
      images: ["/twitter-image"],
    },
  };
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(24,24,27,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-40 mx-auto h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-3xl" />
      <MarketingNav />
      <main className="relative">{children}</main>
      <MarketingFooter />
    </div>
  );
}
