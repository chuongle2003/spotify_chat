import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { ChatProvider } from "@/context/chat-context";
import { OfflineProvider } from "@/context/offline-context";
import { Toaster } from "@/components/ui/toaster";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { PlayerBar } from "@/components/player/PlayerBar";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Cải thiện hiển thị font
  preload: true,   // Preload font
});

export const metadata: Metadata = {
  title: {
    template: '%s | Spotify Clone',
    default: 'Spotify Clone',
  },
  description: "A professional music streaming interface",
  generator: 'v0.dev',
  icons: [
    {
      rel: 'icon',
      url: '/spotify-logo.png',
    },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://spotifybackend.shop"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/spotify-logo.png"
          as="image"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider>
              <OfflineProvider>
                <PlayerProvider>
                  <main className="pb-24">
                    {children}
                  </main>
                  <PlayerBar />
                </PlayerProvider>
              </OfflineProvider>
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
