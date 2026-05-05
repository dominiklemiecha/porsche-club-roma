/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  images: { unoptimized: true },
  async rewrites() {
    const target = process.env.INTERNAL_API_URL || 'http://api:3001';
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }];
  },
};
export default config;
