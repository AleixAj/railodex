import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactivado: casi todas las pantallas dependen del usuario con sesión, así que se
  // renderizan en cada petición. Se puede activar más adelante para páginas públicas.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
