/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vrsoc/types", "@vrsoc/validation", "@vrsoc/config", "@vrsoc/ui"],
};

export default nextConfig;
