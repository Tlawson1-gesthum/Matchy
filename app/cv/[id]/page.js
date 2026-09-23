import { createClient } from '@supabase/supabase-js';
import CvHoja from '../../../components/CvHoja';

// Se genera cuando alguien visita el enlace, no durante el build.
export const dynamic = 'force-dynamic';

export default async function CvPublico({ params }) {
  const id = String(params?.id || '');

  // Un identificador con formato inválido ni siquiera se consulta
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return <div className="container">Este CV no está disponible.</div>;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  // La función devuelve un solo CV por vez: sirve para el enlace compartible,
  // pero no permite descargar la lista completa.
  const { data: cv } = await supabase.rpc('cv_publico', { p_id: id });

  if (!cv) {
    return <div className="container">Este CV no está disponible.</div>;
  }

  return (
    <div>
      <header className="cabecera no-imprimir">
        <a className="cabecera-marca" href="/">Voral</a>
      </header>
      <CvHoja cv={cv} />
    </div>
  );
}
