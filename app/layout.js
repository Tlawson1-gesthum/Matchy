import './globals.css';

export const metadata = {
  icons: { icon: '/icon.png' },
  title: 'Voral: empleo gastronómico en Posadas',
  description:
    'Voral conecta a trabajadores y locales gastronómicos de Posadas. Armá tu CV una vez, o encontrá candidatos por puesto, turno y disponibilidad.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
