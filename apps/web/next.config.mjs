/** @type {import('next').NextConfig} */
const apiOrigin =
  process.env.CARDVERSE_API_ORIGIN ??
  (process.env.API_URL?.startsWith("http") ? process.env.API_URL : undefined) ??
  "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cardverse/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "images.ygoprodeck.com" },
    ],
  },
  async rewrites() {
    // Production uses vercel.json rewrites — env vars are redacted during `next build`.
    if (process.env.VERCEL) {
      return [];
    }
    return [
      { source: "/backend/:path*", destination: `${apiOrigin}/:path*` },
      { source: "/socket.io/:path*", destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/collection", destination: "/account", permanent: true },
      { source: "/account/sales", destination: "/account/sell", permanent: true },
      { source: "/account/sales/:id", destination: "/account/purchases/:id", permanent: true },
      { source: "/admin/products", destination: "/admin?tab=products", permanent: true },
    ];
  },
};

export default nextConfig;
