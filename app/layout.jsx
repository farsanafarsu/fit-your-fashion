import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Header from "@/components/Header";
import Overlays from "@/components/overlays/Overlays";
import Sound from "@/components/Sound";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export const metadata = {
  title: "FIT YOUR FASHION — Wear the future",
  description: "Luxury-meets-future fashion with an AI dressing room and personal stylist.",
};

export const viewport = { themeColor: "#1E1530", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${jost.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <AppProvider>
          <SmoothScroll>
            <Header />
            {children}
            <Overlays />
            <Cursor />
            <Sound />
            <div className="ambience" aria-hidden />
          </SmoothScroll>
        </AppProvider>
      </body>
    </html>
  );
}
