import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const soraDisplay = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Harunex — Your anime, beautifully tracked.",
  description:
    "Harunex v1 is a beautiful anime & manga tracker powered by MyAnimeList, MangaDex, and AniList. Browse, discover, and track what you watch.",
  keywords: [
    "Harunex",
    "anime tracker",
    "manga tracker",
    "MyAnimeList",
    "MangaDex",
    "AniList",
    "Jikan",
    "anime",
    "manga",
    "track anime",
  ],
  authors: [{ name: "xobe" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Harunex v1 — Your anime, beautifully tracked.",
    description:
      "Browse, discover, and track the anime & manga you love. Powered by MyAnimeList, MangaDex, and AniList.",
    siteName: "Harunex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harunex v1",
    description: "Your anime, beautifully tracked.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${soraDisplay.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
