import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

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

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-2343633734899216";
const adsenseTestMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === "true";

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
        {adsenseClient && (process.env.NODE_ENV !== "development" || adsenseTestMode) ? (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <GTagManager />
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
