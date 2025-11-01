import { AppLayout } from "@serp-extensions/app-core/components/app-layout";
import type { Metadata } from "next";

import { resolveBaseUrl } from "@/lib/sitemap-utils";

const siteUrl = resolveBaseUrl();
const defaultTitle = "SERP Extensions | Curated Browser Tools, SEO Add-ons, and Productivity Enhancers";
const defaultDescription =
  "Browse curated Chrome and Firefox extensions vetted by the SERP team for SEO, marketing, and workflow automation.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | SERP Extensions",
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SERP Extensions",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
