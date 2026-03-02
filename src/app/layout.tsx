import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── SEO & PWA Metadata ───────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "StreamShare",
    template: "%s | StreamShare",
  },
  description: "Gestiona pagos compartidos de servicios de streaming",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamShare",
    // Quita startupImage si aún no generas los splash PNGs de iOS
    startupImage: [
      {
        url: "/splash/apple-splash-1320-2868.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1179-2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1290-2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1170-2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1284-2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-750-1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

// ─── Inline Loading Screen ────────────────────────────────────
// Critical: these styles go in <head> to prevent white flash on PWA launch.
// The browser paints background-color BEFORE parsing <body>, so we also
// set html/body bg here to match the app background instantly.
const CRITICAL_STYLES = `
  html, body {
    background-color: #0a0a0f !important;
  }
  #streamshare-loader {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    background-color: #0a0a0f;
    transition: opacity 0.3s ease-out;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  #streamshare-loader.fade-out {
    opacity: 0;
    pointer-events: none;
  }
  #streamshare-loader svg {
    width: 56px;
    height: 56px;
    color: #f97316;
  }
  #streamshare-loader .loader-bar {
    width: 48px;
    height: 3px;
    border-radius: 2px;
    background: rgba(249, 115, 22, 0.15);
    overflow: hidden;
    position: relative;
  }
  #streamshare-loader .loader-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 40%;
    border-radius: 2px;
    background: #f97316;
    animation: loader-slide 1s ease-in-out infinite;
  }
  @keyframes loader-slide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(200%); }
    100% { transform: translateX(-100%); }
  }
`;

const LOADER_SCRIPT = `
  (function() {
    function hideLoader() {
      var el = document.getElementById('streamshare-loader');
      if (!el || el.dataset.hidden) return;
      el.dataset.hidden = '1';
      el.classList.add('fade-out');
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 350);
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
      className={`dark ${inter.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Critical styles in <head> — paints #0a0a0f before body is parsed */}
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_STYLES }} />
      </head>
      <body
        className="min-h-dvh bg-[#0a0a0f] font-sans text-white antialiased"
        suppressHydrationWarning
      >
        {/* ── PWA Loading Screen (pre-hydration, first child) ── */}
        <div id="streamshare-loader" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M14 3h-4C6.229 3 4.343 3 3.172 4.172S2 7.229 2 11s0 5.657 1.172 6.828S6.229 19 10 19h4c3.771 0 5.657 0 6.828-1.172S22 14.771 22 11s0-5.657-1.172-6.828S17.771 3 14 3"
              opacity="0.5"
            />
            <path d="M9.95 16.05c.93-.93 1.396-1.396 1.97-1.427q.08-.003.159 0c.574.03 1.04.496 1.971 1.427c2.026 2.026 3.039 3.039 2.755 3.913a1.5 1.5 0 0 1-.09.218C16.297 21 14.865 21 12 21s-4.298 0-4.715-.819a1.5 1.5 0 0 1-.09-.218c-.284-.874.729-1.887 2.755-3.913" />
          </svg>
          <div className="loader-bar" />
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
