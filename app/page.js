import { createClient } from '@supabase/supabase-js';
import Encabezado from '../components/Encabezado';
import Pie from '../components/Pie';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function obtenerPulso() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const [{ count: vacantes }, { count: candidatos }] = await Promise.all([
      supabase.from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'activa'),
      supabase.from('cvs').select('id', { count: 'exact', head: true }).eq('publico', true),
    ]);
    return { vacantes: vacantes || 0, candidatos: candidatos || 0 };
  } catch {
    return { vacantes: 0, candidatos: 0 };
  }
}

export default async function Home() {
  const { vacantes, candidatos } = await obtenerPulso();

  return (
    <div>
      <Encabezado links={[{ href: '/cv-modelo', texto: 'CV de ejemplo' }]} />

      <main className="container">
        <h1 className="portada-titular">
          Encontrá tu match laboral en Posadas. Rápido y efectivo.
        </h1>

        <p className="portada-pulso">
          <b>{vacantes}</b> {vacantes === 1 ? 'vacante abierta' : 'vacantes abiertas'} ·{' '}
          <b>{candidatos}</b> {candidatos === 1 ? 'perfil cargado' : 'perfiles cargados'} · Posadas y alrededores
        </p>

        <div className="tarjetas-portada">
          <section className="tarjeta-portada">
            <h2>¿Buscás empleo?</h2>
            <p>Armá tu CV digital, compartilo al instante y destacá en el mercado local.</p>
            <a className="btn" href="/candidato/registro">Crear CV gratis</a>
          </section>

          <section className="tarjeta-portada">
            <h2>¿Ofrecés empleo?</h2>
            <p>Publicá vacantes y accedé a candidatos precalificados y ordenados por expectativas.</p>
            <a className="btn" href="/empleador/registro">Publicar vacante</a>
          </section>
        </div>
      </main>

      <Pie />
    </div>
  );
}
