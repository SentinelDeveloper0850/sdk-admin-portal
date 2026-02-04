/* eslint-disable @next/next/no-sync-scripts */
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "antd/dist/reset.css";
import type { Metadata } from "next";

import Providers from "./components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDK Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SDK Admin Portal</title>
        <link
          rel="icon"
          type="image/svg+xml"
          href="/logo.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/logo.png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className="h-screen w-screen">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
