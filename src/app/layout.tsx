import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import {Toaster} from "react-hot-toast"
import AuthProvider from "@/context/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Use env var (NEXT_PUBLIC_APP_URL) if provided, fallback to production URL.
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugscope-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "BugScope",
  description: "Your AI-powered security testing platform",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "BugScope",
    description: "Your AI-powered security testing platform",
    url: appUrl,
    siteName: "BugScope",
    type: "website",
    images: [
      {
        // Use PNG for more reliable social card rendering (SVG support inconsistent across platforms)
        url: "/bugscope.png",
        width: 1200,
        height: 630,
        alt: "BugScope logo preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BugScope",
    description: "Your AI-powered security testing platform",
    // Mirror OpenGraph image with PNG variant
    images: ["/bugscope.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <Toaster />
        {children}
      </body>
      </AuthProvider>
    </html>
  );
}
