import type { NextConfig } from "next";

// Headers de segurança. Sobre frame-ancestors:
// - catch-all: 'none' (bloqueia clickjacking do admin)
// - /widget: '*' (o widget PRECISA ser embeddável em qualquer site)
// Não usamos X-Frame-Options: headers() não consegue REMOVER um header
// per-route, e XFO não tem valor "allow-all" — CSP frame-ancestors tem
// precedência em todos os browsers modernos.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // pdf-parse é carregado via createRequire em src/lib/documents/parser.ts;
  // precisa ficar fora do bundle para o require dinâmico resolver em produção
  serverExternalPackages: ["pdf-parse"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Declarado por último: para a mesma chave, a última entrada vence
        source: "/widget",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
