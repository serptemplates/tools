import { AppLayout } from "@serp-tools/app-core/components/app-layout";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools.serp.co";
const metadataBase = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);

export const metadata: Metadata = {
  metadataBase,
  title: "SERP Tools",
  description: "Free online file converters, compressors, and utilities for images, audio, and video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
