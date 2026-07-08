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
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "images.ygoprodeck.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${apiOrigin}/:path*` },
      { source: "/socket.io/:path*", destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
