import { createClient } from '@supabase/supabase-js';
import CvVista from '../../../components/CvVista';

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
      <CvVista cv={cv} />
    </div>
  );
}
