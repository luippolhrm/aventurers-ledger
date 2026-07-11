/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // El proyecto compila sin errores de tipos; mantener en false para que el
    // build falle si se introduce un error y no se enmascare la deuda técnica.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
}

export default nextConfig
