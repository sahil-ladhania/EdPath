import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EdPath",
  description: "Turn one PDF into a guided, interactive lesson.",
  icons: {
    icon: "/edpath-logo.svg",
    shortcut: "/edpath-logo.svg",
    apple: "/edpath-logo.png",
  },
};

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
      <body className="flex min-h-full flex-col bg-paper-textured font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
