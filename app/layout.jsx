import { Cormorant_Garamond, Manrope, Mrs_Saint_Delafield, Unbounded } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Header from "@/components/Header";
import Overlays from "@/components/overlays/Overlays";
import Sound from "@/components/Sound";
import TryOnRoot from "@/components/tryon/TryOnRoot";

// Couture serif for display type, a quiet geometric sans for everything you read or tap.
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
// Hand-signed script for the brand signature (preloader, footer).
const script = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "block" });
// Extended grotesk for the hero's streetwear-scale wordmark.
const wide = Unbounded({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--font-wide", display: "swap" });

export const metadata = {
  title: "FIT YOUR FASHION — Wear the future",
  description: "Luxury-meets-future fashion with an AI dressing room and personal stylist.",
};

export const viewport = { themeColor: "#1E1530", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${script.variable} ${wide.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <AppProvider>
          <SmoothScroll>
            <Header />
            {children}
            <Overlays />
            <TryOnRoot />
            <Cursor />
            <Sound />
            <div className="ambience" aria-hidden />
          </SmoothScroll>
        </AppProvider>
      </body>
    </html>
  );
}
