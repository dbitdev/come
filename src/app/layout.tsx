import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Come - La Guía Gastronómica de México",
  description: "Descubre los mejores restaurantes, chefs y tendencias gourmet en México. La guía definitiva para los amantes del buen comer.",
  keywords: ["gastronomía", "México", "restaurantes", "chefs", "guía gourmet", "estrellas michelin"],
  authors: [{ name: "Néctar Editorial" }],
  openGraph: {
    title: "Come - La Guía Gastronómica de México",
    description: "La guía definitiva y curada de las mejores experiencias gastronómicas en México.",
    url: "https://comeapp.com.mx",
    siteName: "Néctar",
    images: [
      {
        url: "/come.jpg",
        width: 1200,
        height: 630,
        alt: "Come - La Guía Gastronómica de México",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Come - La Guía Gastronómica de México",
    description: "La guía definitiva y curada de las mejores experiencias gastronómicas en México.",
    images: ["/come.jpg"],
  },
  icons: {
    icon: "/logo-c.png",
    apple: "/logo-c.png",
  }
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
