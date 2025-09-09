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

export const metadata: Metadata = {
  title: "BugScope",
  description: "Your AI-powered security testing platform",
  openGraph: {
    title: "BugScope",
    description: "Your AI-powered security testing platform",
    url: "https://bugscope-gamma.vercel.app/",
    type: "website",
    images: [
      {
        url: "/bug.svg",
        width: 1200,
        height: 630,
        alt: "BugScope preview",
      },
    ],
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
