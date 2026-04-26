/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@library-app/db", "@library-app/shared"]
};

export default nextConfig;

