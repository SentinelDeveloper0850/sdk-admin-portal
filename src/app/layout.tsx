/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";

import "antd/dist/reset.css";

import Footer from "./components/app-footer";
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
        {/* <link href="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.css"  rel="stylesheet" /> */}
      </head>
      <body className="h-screen w-screen">
        <Providers>
          <main className="flex-grow overflow-auto">{children}</main>
          <Footer />
        </Providers>
        {/* <script src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></script> */}
      </body>
    </html>
  );
}
