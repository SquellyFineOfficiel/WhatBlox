import '@/src/app/globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import Header from '@/src/components/header';

export const metadata: Metadata = {
  title: 'WhatBlox',
  description: 'Discover gem Roblox games',
  icons: {
    icon: '/branding/favicon.png',
    shortcut: '/branding/favicon.png',
    apple: '/branding/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#080810',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i) {w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TNQ838BF');`}
        </Script>
        {/* End Google Tag Manager */}

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-41ZERN3XJE"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-41ZERN3XJE');
          `}
        </Script>
        {/* End Google tag (gtag.js) */}

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2761470674512958"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* End Google AdSense */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TNQ838BF"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <a
          href="#main-content"
          className="sr-only z-[60] rounded-md bg-rbx-surface-2 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-rbx-orange"
        >
          Skip to main content
        </a>
        <div className="min-h-screen bg-rbx-bg">
          <Suspense fallback={<div className="h-16 bg-rbx-surface" />}>
            <Header />
          </Suspense>
          <div id="main-content" className="pt-28 md:pt-16">{children}</div>
          <footer className="border-t border-rbx-border bg-rbx-surface/70 backdrop-blur">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 text-sm text-rbx-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} WhatBlox</p>
              <div className="flex items-center gap-6">
                <Link href="/privacy-policy" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="rounded-md transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange">
                  Terms of Service
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}