import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 静态导出：next build 产物输出到 out/，可直接托管到 Cloudflare Pages
  output: 'export',
  devIndicators: false,
};

export default nextConfig;
