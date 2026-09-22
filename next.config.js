/** @type {import('next').NextConfig} */

// Encabezados de seguridad que se envían con cada página.
const encabezadosSeguridad = [
  // Impide que otro sitio muestre Matchy dentro de un marco para engañar con clics
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Impide que el navegador interprete un archivo como algo distinto de lo que es
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No revela direcciones completas a otros sitios al salir desde Matchy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Matchy no usa cámara, micrófono, ubicación ni pagos: se bloquean
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Obliga a usar siempre conexión segura
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: encabezadosSeguridad }];
  },
};

module.exports = nextConfig;
