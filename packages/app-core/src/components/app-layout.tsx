import { Geist, Geist_Mono } from "next/font/google";

import { AppHeader } from "./app-header";
import { Providers } from "./providers";
import { GTagManager } from "./gtag-manager";

import "@serp-tools/ui/globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <GTagManager />
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
