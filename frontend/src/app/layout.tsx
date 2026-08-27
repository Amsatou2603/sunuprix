import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EnregistreurServiceWorker } from "@/components/pwa/EnregistreurServiceWorker";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export const metadata: Metadata = {
  title: {
    default: "SunuPrix — Suivi et prédiction des prix au Sénégal",
    template: "%s · SunuPrix",
  },
  description:
    "Plateforme multi-rôles de suivi et de prédiction des prix de produits de consommation au Sénégal. Projet de fin de formation, données fictives à but pédagogique.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SunuPrix",
  },
  icons: {
    icon: [
      { url: "/design/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};


export const viewport: Viewport = {
  themeColor: "#0B2E24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <Header />
          <main className="w-full flex-1">{children}</main>
          <Footer />
          <ChatbotWidget />
        </AuthProvider>

        <EnregistreurServiceWorker />
      </body>
    </html>
  );
}
