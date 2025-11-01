import { AppLayout } from "@serp-extensions/app-core/components/app-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Serp Extensions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
