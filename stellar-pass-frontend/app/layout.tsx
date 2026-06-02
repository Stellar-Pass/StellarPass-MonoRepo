import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Stellar Pass - NFT Event Ticketing on Stellar",
    template: "%s | Stellar Pass",
  },
  description:
    "NFT-powered event ticketing platform on the Stellar blockchain. Secure, verifiable, and decentralized tickets with POAP badges.",
  keywords: [
    "stellar",
    "NFT",
    "ticketing",
    "events",
    "blockchain",
    "POAP",
    "web3",
  ],
  authors: [{ name: "Stellar Pass" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stellarpass.io",
    siteName: "Stellar Pass",
    title: "Stellar Pass - NFT Event Ticketing on Stellar",
    description:
      "NFT-powered event ticketing platform on the Stellar blockchain.",
    images: [
      {
        url: "https://stellarpass.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stellar Pass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellar Pass - NFT Event Ticketing on Stellar",
    description:
      "NFT-powered event ticketing platform on the Stellar blockchain.",
    images: ["https://stellarpass.io/og-image.png"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4263eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
