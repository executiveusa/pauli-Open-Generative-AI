import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder'],
  // Allow images from common AI provider CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.huggingface.co' },
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: '**.muapi.ai' },
    ],
  },
  // Redirect bare root to mol dashboard
  async redirects() {
    return [
      { source: '/', destination: '/mol/dashboard', permanent: false },
    ];
  },
  // Alias submodule packages to stubs when the submodules aren't initialised
  webpack(config) {
    const stubAiAgent = path.resolve(__dirname, 'stubs/ai-agent/dist/index.js');
    const stubWorkflow = path.resolve(__dirname, 'stubs/workflow-builder/dist/index.js');
    const stubAiCss = path.resolve(__dirname, 'stubs/ai-agent/dist/tailwind.css');
    const stubWfCss = path.resolve(__dirname, 'stubs/workflow-builder/dist/tailwind.css');

    config.resolve.alias = {
      ...config.resolve.alias,
      'ai-agent': stubAiAgent,
      'ai-agent/dist/tailwind.css': stubAiCss,
      'workflow-builder': stubWorkflow,
      'workflow-builder/dist/tailwind.css': stubWfCss,
    };
    return config;
  },
};

export default nextConfig;
