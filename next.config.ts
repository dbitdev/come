import type { NextConfig } from "next";

// Estas cabeceras vivían en firebase.json > hosting.headers, pero el sitio se
// despliega en Firebase App Hosting (Cloud Run) en modo servidor: esa sección
// sólo aplica a Firebase Hosting estático, así que en producción no se estaban
// enviando. Emitirlas desde Next garantiza que lleguen.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(self), geolocation=(self), interest-cohort=()",
  },
];

// App Hosting inyecta FIREBASE_WEBAPP_CONFIG con la configuración del web app
// enlazado al backend. No lleva el prefijo NEXT_PUBLIC_, así que Next no la
// incrusta en el bundle del cliente por su cuenta: se reexpone aquí. Esto hace
// que el sitio funcione en producción aunque el apphosting.yaml no se aplique.
const configWebDeAppHosting = process.env.FIREBASE_WEBAPP_CONFIG ?? "";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG: configWebDeAppHosting,
  },
  // Firebase App Hosting (Cloud Run) runs Next.js in server mode.
  // Do NOT use output: 'export' — that is for static hosting only.
  poweredByHeader: false,
  // /order era un re-export de /ordenar: dos URLs con el mismo contenido y sin
  // canónica, que es contenido duplicado para Google.
  async redirects() {
    return [{ source: "/order", destination: "/ordenar", permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
