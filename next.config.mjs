// CSP: liberar LiveKit WSS, Unsplash imagens, Neon (não webfacing) e selfs.
// 'unsafe-inline' em style-src é necessário pra Tailwind e fontes do Next.
// 'unsafe-eval' em scripts: Next dev usa eval em fast-refresh; em prod, removido.
const isDev = process.env.NODE_ENV !== "production";

const livekitWss = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
const livekitHttp = livekitWss.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");

const csp = [
  "default-src 'self'",
  // Scripts: Next inline + chunks self. Em dev, eval é necessário pro HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://usc1.contabostorage.com",
  // WebSocket LiveKit + APIs same-origin + LiveKit HTTP
  `connect-src 'self' ${livekitWss} ${livekitHttp} https://usc1.contabostorage.com`.trim(),
  // LiveKit usa media; permitir blob (vídeo local)
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy",   value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(self), microphone=(self), geolocation=()" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "X-XSS-Protection",          value: "0" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: corrigir os ~30 erros pré-existentes de TS (consultations/[id], prescriptions, etc)
  //       e remover estes 2 ignores antes do go-live final.
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.neon.tech" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "usc1.contabostorage.com" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
