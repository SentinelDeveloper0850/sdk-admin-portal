/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";

import "antd/dist/reset.css";

import Providers from "./components/providers";
import "./globals.css";
import Script from "next/script";

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
        {/* Load PDF.js from unpkg CDN - more reliable */}
        {/* <Script src="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.min.js" strategy="beforeInteractive" />
        <Script id="pdf-worker-config" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              // Define a global variable to track PDF.js loading status
              window.PDFJS_LOADED = false;
              
              // Check if PDF.js is loaded
              const checkPDFJS = function() {
                if (window.pdfjsLib) {
                  console.log('PDF.js loaded successfully');
                  
                  try {
                    // Set worker source using the correct method
                    // The workerSrc property should be set before using pdfjsLib
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
                    window.PDFJS_LOADED = true;
                    console.log('PDF.js worker source set successfully');
                  } catch (e) {
                    console.error('Error setting PDF.js worker source:', e);
                    
                    // Alternative approach if the above fails
                    try {
                      if (typeof window.pdfjsLib.getDocument !== 'undefined') {
                        console.log('Using alternative method to set worker source');
                        // Some versions might require this approach
                        const pdfjs = window.pdfjsLib;
                        pdfjs.GlobalWorkerOptions = { workerSrc: 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js' };
                        window.PDFJS_LOADED = true;
                      }
                    } catch (e2) {
                      console.error('Alternative method also failed:', e2);
                    }
                  }
                } else {
                  console.warn('PDF.js not loaded yet');
                }
              };
              
              // Try immediately
              checkPDFJS();
              
              // Also try after window load event
              window.addEventListener('load', checkPDFJS);
              
              // And try after a short delay
              setTimeout(checkPDFJS, 1000);
            }
          `}
        </Script> */}
      </head>
      <body className="h-screen w-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
