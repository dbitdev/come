import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./wonder-system.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // AUDITORÍA: sin metadataBase, la imagen /come.jpg de Open Graph se resuelve
  // como ruta relativa y las previsualizaciones sociales salen rotas.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://comeapp.com.mx"),
  alternates: { canonical: "/" },
  applicationName: "Come",
  title: "Come: restaurantes, chefs y guía gastronómica de México",
  description: "Descubre restaurantes, chefs, rutas, comida mexicana, menús y lugares para comer en CDMX, Puebla, Oaxaca y todo México con Come y ComeApp.",
  keywords: ["Come", "ComeApp", "Come México", "guía gastronómica de México", "restaurantes en México", "lugares para comer", "comida mexicana", "chefs mexicanos", "rutas gastronómicas", "menús de restaurantes"],
  authors: [{ name: "Come" }],
  creator: "Come",
  publisher: "Come",
  category: "gastronomía",
  openGraph: {
    title: "Come: restaurantes, chefs y guía gastronómica de México",
    description: "Restaurantes, chefs, rutas, comida mexicana y lugares para comer en México.",
    url: "https://comeapp.com.mx",
    siteName: "Come",
    images: [
      {
        url: "/come-icono.png",
        width: 1024,
        height: 1024,
        alt: "Come - La Guía Gastronómica de México",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Come: restaurantes, chefs y guía gastronómica de México",
    description: "Restaurantes, chefs, rutas, comida mexicana y lugares para comer en México.",
    images: ["/come-icono.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/brand/come-icono-tortilla-crema-1024.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://comeapp.com.mx/#website",
                url: "https://comeapp.com.mx/",
                name: "Come",
                alternateName: ["ComeApp", "Come México", "Come Guía Gastronómica"],
                inLanguage: "es-MX",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://comeapp.com.mx/#organization",
                name: "Come",
                alternateName: ["ComeApp", "Come México"],
                url: "https://comeapp.com.mx/",
                logo: "https://comeapp.com.mx/brand/come-icono-verde-1024.png",
                sameAs: ["https://www.instagram.com/comeapptv/"],
              },
            ]).replace(/</g, "\\u003c"),
          }}
        />
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
