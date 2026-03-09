import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ─── SEO & PWA Metadata ───────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "StreamShare",
    template: "%s | StreamShare",
  },
  description: "Gestiona pagos compartidos de servicios de streaming",
  openGraph: {
    title: "StreamShare",
    description: "Gestiona pagos compartidos de servicios de streaming",
    siteName: "StreamShare",
    locale: "es_MX",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "StreamShare",
    description: "Gestiona pagos compartidos de servicios de streaming",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamShare",
    startupImage: [
      // iPhone 16 Pro Max (440×956 @3x)
      {
        url: "/splash/apple-splash-1320-2868.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 16 Pro (402×874 @3x)
      {
        url: "/splash/apple-splash-1206-2622.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 16 Plus / 15 Plus / 15 Pro Max (430×932 @3x)
      {
        url: "/splash/apple-splash-1290-2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 16 / 15 / 15 Pro / 14 Pro (393×852 @3x)
      {
        url: "/splash/apple-splash-1179-2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Plus / 13 Pro Max / 12 Pro Max (428×926 @3x)
      {
        url: "/splash/apple-splash-1284-2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 / 13 / 13 Pro / 12 / 12 Pro (390×844 @3x)
      {
        url: "/splash/apple-splash-1170-2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 11 Pro / X / XS (375×812 @3x)
      {
        url: "/splash/apple-splash-1125-2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 11 Pro Max / XS Max (414×896 @3x)
      {
        url: "/splash/apple-splash-1242-2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 11 / XR (414×896 @2x)
      {
        url: "/splash/apple-splash-828-1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone SE 2nd/3rd gen (375×667 @2x)
      {
        url: "/splash/apple-splash-750-1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 12.9" (1024×1366 @2x)
      {
        url: "/splash/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// ─── Viewport (export separado en Next.js 15+) ───────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

// ─── Inline Loading Screen ────────────────────────────────────
// iOS PWA: Safari renders html/body background BEFORE any <style> or CSS file.
// The only way to guarantee no white flash is inline `style` attributes on
// <html> and <body>, plus the loader div with all styles inline (no classes).
// The <style> tag in <head> is kept only for the animation keyframes.
const LOADER_KEYFRAMES = `
  @keyframes loader-slide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(200%); }
    100% { transform: translateX(-100%); }
  }
  #streamshare-loader.fade-out {
    opacity: 0 !important;
    pointer-events: none;
  }
`;

const LOADER_SCRIPT = `
  (function() {
    function hideLoader() {
      var el = document.getElementById('streamshare-loader');
      if (!el || el.dataset.hidden) return;
      el.dataset.hidden = '1';
      el.classList.add('fade-out');
      setTimeout(function() { el.style.display = 'none'; }, 350);
    }
    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
    }
    setTimeout(hideLoader, 4000);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${inter.variable}`}
      style={{ backgroundColor: "#0a0a0f" }}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://api.iconify.design"
          crossOrigin="anonymous"
        />
        <style dangerouslySetInnerHTML={{ __html: LOADER_KEYFRAMES }} />
      </head>
      <body
        className="min-h-dvh bg-[#0a0a0f] font-sans text-white antialiased"
        style={{ backgroundColor: "#0a0a0f", margin: 0 }}
        suppressHydrationWarning
      >
        {/* ── PWA Loading Screen — ALL styles inline for instant paint ── */}
        <div
          id="streamshare-loader"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            backgroundColor: "#0a0a0f",
            transition: "opacity 0.3s ease-out",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="#f97316"
          >
            <path
              d="M14 3h-4C6.229 3 4.343 3 3.172 4.172S2 7.229 2 11s0 5.657 1.172 6.828S6.229 19 10 19h4c3.771 0 5.657 0 6.828-1.172S22 14.771 22 11s0-5.657-1.172-6.828S17.771 3 14 3"
              opacity="0.5"
            />
            <path d="M9.95 16.05c.93-.93 1.396-1.396 1.97-1.427q.08-.003.159 0c.574.03 1.04.496 1.971 1.427c2.026 2.026 3.039 3.039 2.755 3.913a1.5 1.5 0 0 1-.09.218C16.297 21 14.865 21 12 21s-4.298 0-4.715-.819a1.5 1.5 0 0 1-.09-.218c-.284-.874.729-1.887 2.755-3.913" />
          </svg>
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: "rgba(249,115,22,0.15)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "40%",
                borderRadius: 2,
                background: "#f97316",
                animation: "loader-slide 1s ease-in-out infinite",
              }}
            />
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />

        {/* ── App ── */}
        <Providers>
          {children}
          <Toaster theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
