'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export default function VacantesEmpleador() {
  const router = useRouter();
  const [vacantes, setVacantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [pendientes, setPendientes] = useState(0);

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      router.push('/empleador/login');
      return;
    }
    const { data: admin } = await supabase
      .from('administradores').select('id').eq('id', uid).maybeSingle();
    setEsAdmin(!!admin);

    if (admin) {
      const { count } = await supabase
        .from('empleadores')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      setPendientes(count || 0);
    }

    const { data } = await supabase
      .from('vacantes')
      .select('*, postulaciones(count)')
      .eq('empleador_id', uid)
      .order('created_at', { ascending: false });
    setVacantes(data || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function marcarCubierta(id, puesto) {
    const ok = window.confirm(
      `¿Marcar la vacante de ${puesto} como cubierta?\n\n` +
      'Se va a sacar del listado público y los candidatos ya no van a poder postularse. ' +
      'Esta acción no se puede deshacer: si necesitás volver a buscar, vas a tener que publicar una vacante nueva.'
    );
    if (!ok) return;
    await supabase.from('vacantes').update({ estado: 'cubierta' }).eq('id', id);
    cargar();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (cargando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <Encabezado
        links={[{ href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }]}
        destacado={esAdmin ? { href: '/admin/locales', texto: 'Aprobar locales', cantidad: pendientes } : null}
      />
      <div className="container">
        <h1>Mis vacantes</h1>
        {vacantes.length === 0 && (
          <div className="card">
            <p style={{ marginTop: 0 }}>Todavía no publicaste ninguna vacante.</p>
            <a className="btn" href="/empleador/vacantes/nueva">Publicar la primera</a>
          </div>
        )}
        {[...vacantes].sort((a, b) => (a.estado === 'activa' ? -1 : 1) - (b.estado === 'activa' ? -1 : 1)).map((v) => (
          <div key={v.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>{v.puesto}</h3>
                <p className="mono" style={{ fontSize: '0.85rem', margin: 0 }}>
                  {v.postulaciones?.[0]?.count || 0} postulantes · Estado: {v.estado}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a className="btn secundario" href={`/empleador/vacantes/${v.id}`}>Ver postulantes</a>
                {v.estado === 'activa' && (
                  <button className="btn secundario" onClick={() => marcarCubierta(v.id, v.puesto)}>Marcar cubierta</button>
                )}
              </div>
            </div>
          </div>
        ))}

        <p style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {esAdmin && <a className="btn secundario" href="/admin/locales">Aprobar locales</a>}
          <button className="btn secundario" onClick={cerrarSesion}>Cerrar sesión</button>
        </p>
      </div>
      <Pie />
    </div>
  );
}
