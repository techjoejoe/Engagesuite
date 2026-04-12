import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  metadataBase: new URL('https://trainer-toolbox.com'),
  title: {
    default: "Trainer-Toolbox — Free Interactive Training Tools | Kahoot Alternative",
    template: "%s | Trainer-Toolbox",
  },
  description: "Trainer-Toolbox is a free interactive training platform with live polls, trivia games, word clouds, gradebooks, and workbooks. The best Kahoot alternative for trainers and educators.",
  keywords: [
    "kahoot alternative",
    "free kahoot alternative",
    "live polling tool",
    "classroom engagement tools",
    "interactive training platform",
    "trivia game maker",
    "live quiz app",
    "word cloud generator",
    "audience engagement software",
    "training tools for educators",
    "mentimeter alternative",
    "classroom gamification",
    "digital workbook creator",
    "online gradebook",
    "photo contest app",
  ],
  authors: [{ name: "Trainer-Toolbox Team" }],
  creator: "Trainer-Toolbox",
  publisher: "Trainer-Toolbox",

  // Open Graph (for social sharing)
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: 'https://trainer-toolbox.com',
    siteName: "Trainer-Toolbox",
    title: "Trainer-Toolbox — Free Interactive Training Tools | Kahoot Alternative",
    description: "Trainer-Toolbox is a free interactive training platform with live polls, trivia games, word clouds, and more. The best Kahoot alternative for trainers.",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image to /public
        width: 1200,
        height: 630,
        alt: "Trainer-Toolbox - Interactive Classroom Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Trainer-Toolbox — Free Interactive Training Tools | Kahoot Alternative",
    description: "Trainer-Toolbox is a free interactive training platform with live polls, trivia games, word clouds, and more.",
    images: ["/og-image.png"],
    creator: "@trainertoolbox",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />
        {/* JSON-LD Structured Data for Google & AI Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Trainer-Toolbox",
              "url": "https://trainer-toolbox.com",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "description": "Trainer-Toolbox is a free interactive training platform with live polls, trivia games, word clouds, gradebooks, workbooks, and photo contests. The best Kahoot and Mentimeter alternative for trainers and educators.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Live Polling",
                "Trivia Games",
                "Word Clouds",
                "Digital Gradebook",
                "Interactive Workbooks",
                "Photo Contests",
                "Leaderboard & Gamification",
                "Real-time Audience Engagement"
              ],
              "creator": {
                "@type": "Organization",
                "name": "Trainer-Toolbox",
                "url": "https://trainer-toolbox.com"
              }
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      <script dangerouslySetInnerHTML={{__html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }
      `}} />
      </body>
    </html>
  );
}
