import "./stellar-command.css";
import "./globals.css";
import "./mobile.css";
import Providers from "./providers";

// Force dynamic rendering for all pages — the app uses SessionProvider
// and localStorage-based auth, which cause prerendering failures.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Social Exchange',
  description: 'Your Social Media Command Center',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#01020a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Social Exchange',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Stellaris Command Design System — Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="breathing">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
