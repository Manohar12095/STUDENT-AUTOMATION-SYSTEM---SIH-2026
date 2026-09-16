import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Student Automation System | Biometric-Verified Identity Gateway",
  description: "Next-generation biometric authentication portal with 4-angle facial enrollment and real-time live presence monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* face-api.js — loaded from CDN before page renders */}
        <Script
          src="https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <div className="bg-mesh" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {children}
      </body>
    </html>
  );
}
