import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "react-hot-toast";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Evenio | Plateforme de gestion d'evenements",
  description: "Creez, publiez et gerez vos evenements. Reservez vos billets en toute simplicite.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${inter.variable} font-body bg-surface text-ink antialiased`}>
        <Toaster position="top-center" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}