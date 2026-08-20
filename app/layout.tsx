import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SessionProvider }    from "@/components/providers/SessionProvider";
import { Toaster }            from "@/components/ui/Toast";
import { ConfirmDialogHost }  from "@/components/ui/ConfirmDialog";
import "./globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

const fraunces = Fraunces({
  subsets:  ["latin"],
  variable: "--font-fraunces",
  display:  "swap",
  axes:     ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default:  "TeleMed – Consultas Médicas Online",
    template: "%s | TeleMed",
  },
  description:
    "Plataforma de telemedicina: consulte médicos especialistas de qualquer lugar, com segurança e comodidade.",
  keywords:   ["telemedicina", "consulta online", "médico online", "saúde digital"],
  authors:    [{ name: "TeleMed" }],
  robots:     { index: true, follow: true },
  openGraph: {
    type:        "website",
    locale:      "pt_BR",
    siteName:    "TeleMed",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width:      "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <ConfirmDialogHost />
      </body>
    </html>
  );
}
