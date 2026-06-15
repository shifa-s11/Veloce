/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is needed for Docker but not for Vercel (Vercel handles this natively)
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
};

export default nextConfig;
