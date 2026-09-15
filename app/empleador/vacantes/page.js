'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function VacantesEmpleador() {
  const router = useRouter();
  const [vacantes, setVacantes] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      router.push('/empleador/login');
      return;
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

  async function marcarCubierta(id) {
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
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <div>
          <a className="btn blanco" href="/empleador/vacantes/nueva" style={{ marginRight: 16 }}>+ Publicar vacante</a>
          <a className="nav-link" href="#" onClick={cerrarSesion}>Cerrar sesión</a>
        </div>
      </div>
      <div className="container">
        <h1>Mis vacantes</h1>
        {vacantes.length === 0 && <p>Todavía no publicaste ninguna vacante.</p>}
        {vacantes.map((v) => (
          <div key={v.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>{v.puesto}</h3>
                <p className="mono" style={{ fontSize: '0.85rem', margin: 0 }}>
                  {v.postulaciones?.[0]?.count || 0} postulantes · Estado: {v.estado}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a className="btn secundario" href={`/empleador/vacantes/${v.id}`}>Ver ranking</a>
                {v.estado === 'activa' && (
                  <button className="btn secundario" onClick={() => marcarCubierta(v.id)}>Marcar cubierta</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
