import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SessionProvider }    from "@/components/providers/SessionProvider";
import { Toaster }            from "@/components/ui/Toast";
import { ConfirmDialogHost }  from "@/components/ui/ConfirmDialog";
import { APP_NAME }           from "@/lib/constants";
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
    default:  `${APP_NAME} – Consultas Médicas Online`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Plataforma de telemedicina: consulte médicos especialistas de qualquer lugar, com segurança e comodidade.",
  keywords:   ["telemedicina", "consulta online", "médico online", "saúde digital"],
  authors:    [{ name: APP_NAME }],
  robots:     { index: true, follow: true },
  openGraph: {
    type:        "website",
    locale:      "pt_BR",
    siteName:    APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
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
