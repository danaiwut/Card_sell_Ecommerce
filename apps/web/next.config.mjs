/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cardverse/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${apiOrigin}/:path*` },
      { source: "/socket.io/:path*", destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/collection", destination: "/account/wishlist", permanent: true },
      { source: "/account/sales", destination: "/account/sell", permanent: true },
      { source: "/account/sales/:id", destination: "/account/purchases/:id", permanent: true },
      { source: "/admin/products", destination: "/admin?tab=products", permanent: true },
    ];
  },
};

export default nextConfig;
