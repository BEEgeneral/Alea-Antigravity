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
  title: "Aleasignature | Exclusividad Inmobiliaria Off-Market",
  description: "Plataforma de inversión privada para activos inmobiliarios exclusivos. Accede a hoteles, edificios y propiedades de lujo fuera del mercado tradicional en España y Portugal.",
  keywords: ["real estate", "luxury", "off-market", "investment", "spain", "portugal", "hotels", "private equity"],
  authors: [{ name: "Aleasignature" }],
  openGraph: {
    title: "Aleasignature | Inversión Inmobiliaria Off-Market",
    description: "Tu puerta de entrada a la inversión discreta y rentable en activos exclusivos.",
    url: "https://aleasignature.com",
    siteName: "Aleasignature",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aleasignature | Inversión Inmobiliaria Off-Market",
    description: "Acceso exclusivo a oportunidades inmobiliarias únicas lejos del mercado tradicional.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const urlParams = new URLSearchParams(window.location.search);
                const theme = urlParams.get('theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              })()
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
