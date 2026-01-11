import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "ClassDash - Interactive Classroom Engagement Platform",
    template: "%s | ClassDash",
  },
  description: "Engage students with live quizzes, polls, word clouds, and interactive activities. Transform your classroom with real-time engagement tools.",
  keywords: [
    "classroom engagement",
    "interactive learning",
    "quiz platform",
    "live polling",
    "education technology",
    "student engagement",
    "kahoot alternative",
    "classroom games",
    "teaching tools",
  ],
  authors: [{ name: "ClassDash Team" }],
  creator: "ClassDash",
  publisher: "ClassDash",

  // Open Graph (for social sharing)
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ClassDash",
    title: "ClassDash - Interactive Classroom Engagement",
    description: "Transform learning with live quizzes, polls, and interactive activities.",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image to /public
        width: 1200,
        height: 630,
        alt: "ClassDash - Interactive Classroom Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "ClassDash - Interactive Classroom Engagement",
    description: "Transform learning with live quizzes, polls, and interactive activities.",
    images: ["/og-image.png"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // Manifest for PWA
  manifest: "/manifest.json",

  // Verification (add your own IDs when ready)
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
