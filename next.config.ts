import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Configurações para melhor compatibilidade com Vercel
  output: 'standalone',
};

export default nextConfig;
