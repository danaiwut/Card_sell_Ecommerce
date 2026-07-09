/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cardverse/shared"],
  images: {
    // เปิด unoptimized เพื่อให้รูปจาก RSS feed (ทุก domain) โหลดได้
    // trade-off คือ Next.js จะไม่ optimize รูปให้ แต่ยังแสดงได้ปกติ
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${apiOrigin}/:path*` },
      { source: "/socket.io/:path*", destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
