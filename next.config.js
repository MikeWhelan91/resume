/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
