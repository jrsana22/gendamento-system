/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'node-cron'],
  },
}

export default nextConfig
