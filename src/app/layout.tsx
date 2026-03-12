import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aleasignature | Originación Privada y Gestión Patrimonial",
  description: "Boutique de originación estratégica y defensa del capital. Mandatos de inversión privada para Multi-Family Offices y fondos institucionales en España y Portugal.",
  keywords: ["real estate", "family office", "wealth management", "private equity", "originación privada", "spain", "portugal"],
  authors: [{ name: "Aleasignature" }],
  openGraph: {
    title: "Aleasignature | Originación Privada Inmobiliaria",
    description: "Defensa del capital y acceso estratégico a oportunidades reservadas.",
    url: "https://aleasignature.com",
    siteName: "Aleasignature",
    locale: "es_ES",
    type: "website",
  },
  metadataBase: new URL("https://aleasignature.com"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "0_HQLBpaeYyAjOq9sQkIe7dxHBDp12_9Pb3pfp-shOw",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aleasignature | Originación Privada",
    description: "Gestión rigurosa de mandatos de inversión y acceso a oportunidades de originación directa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
