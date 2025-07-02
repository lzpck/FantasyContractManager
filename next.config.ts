import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'prisma'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    
    // Excluir arquivos de scripts do build
    config.module.rules.push({
      test: /scripts\/.*/,
      loader: 'ignore-loader'
    });
    
    return config;
  },
  // Configurações para melhor compatibilidade com Vercel
  output: 'standalone',
};

export default nextConfig;
