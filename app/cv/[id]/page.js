import { createClient } from '@supabase/supabase-js';
import CvHoja from '../../../components/CvHoja';

// Fuerza a que esta página se genere en el momento en que alguien la visita
// (no durante el build), así siempre tiene las variables de entorno disponibles.
export const dynamic = 'force-dynamic';

// Cliente propio (sin sesión de usuario) para renderizar en el servidor.
const supabaseServidor = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function CvPublico({ params }) {
  const { data: cv } = await supabaseServidor
    .from('cvs')
    .select('*')
    .eq('id', params.id)
    .eq('publico', true)
    .single();

  if (!cv) {
    return <div className="container">Este CV no está disponible.</div>;
  }

  return (
    <div>
      <div className="navbar no-imprimir">
        <a className="logo" href="/">Matchy</a>
      </div>
      <CvHoja cv={cv} />
    </div>
  );
}
