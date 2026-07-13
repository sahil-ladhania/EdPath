// Import Next.js and React
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Constant for the inter font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Constant for the bricolage font
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Constant for the geist mono font
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Constant for the metadata
export const metadata: Metadata = {
  title: "EdPath",
  description: "Turn your PDF into a guided, interactive lesson.",
  icons: {
    icon: "/edpath-logo.svg",
    shortcut: "/edpath-logo.svg",
    apple: "/edpath-logo.png",
  },
};

// Function to render the root layout
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html
      lang="en"
      className={cn(
        "h-full font-sans antialiased",
        inter.variable,
        bricolage.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
      </body>
    </html>
  );
};