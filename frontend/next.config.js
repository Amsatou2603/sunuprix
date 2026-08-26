/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permet à Next.js de transpiler le package du monorepo @sunuprix/shared
  // (publié en TypeScript source, sans étape de build séparée nécessaire ici).
  transpilePackages: ["@sunuprix/shared"],
};

module.exports = nextConfig;
