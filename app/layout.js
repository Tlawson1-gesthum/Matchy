import './globals.css';

export const metadata = {
  title: 'Matchy — Empleo gastronómico en Posadas',
  description:
    'Matchy conecta a trabajadores y locales gastronómicos de Posadas. Armá tu CV una vez, o encontrá candidatos por puesto, turno y disponibilidad.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
