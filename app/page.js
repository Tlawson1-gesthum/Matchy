import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
    <div className="portada">
      <div className="portada-barra">
        <span className="portada-marca">Matchy</span>
        <span className="portada-pulso">
          Posadas · <b>{vacantes}</b> {vacantes === 1 ? 'vacante abierta' : 'vacantes abiertas'} · <b>{candidatos}</b> {candidatos === 1 ? 'perfil cargado' : 'perfiles cargados'}
        </span>
      </div>

      <h1 className="portada-titular">
        El rubro gastronómico de Posadas, de un lado y del otro del mostrador.
      </h1>

      <div className="portada-split">
        <Link href="/candidato/registro" className="mitad candidato">
          <div>
            <h2 className="mitad-titulo">Busco empleo</h2>
            <p className="mitad-texto">
              Armá tu CV con guías hechas por profesionales para aumentar tus chances de que te contraten.
              Descargalo. Compartilo con quien quieras. En Matchy tenés muchas chances de encontrar trabajo.
            </p>
          </div>
          <span className="mitad-accion">Empezar mi CV, gratis</span>
        </Link>

        <Link href="/empleador/registro" className="mitad empleador">
          <div>
            <h2 className="mitad-titulo">Ofrezco empleo</h2>
            <p className="mitad-texto">
              Publicá tus vacantes y encontrá gente que matchee con tus expectativas. Tranquilx, nosotros nos
              encargamos de que la información te llegue ordenada.
            </p>
          </div>
          <span className="mitad-accion">Publicar una vacante</span>
        </Link>
      </div>

      <div className="portada-barra" style={{ padding: '16px 24px 22px' }}>
        <span className="portada-pulso">
          <Link href="/cv-modelo" style={{ color: '#9FB6A4' }}>Ver un CV de ejemplo</Link>
        </span>
        <span className="portada-pulso">
          <Link href="/candidato/login" style={{ color: '#9FB6A4' }}>Entrar a mi cuenta</Link>
        </span>
      </div>
    </div>
  );
}
