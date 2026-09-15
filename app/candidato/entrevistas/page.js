'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { linkWhatsApp } from '../../../lib/whatsapp';

export default function EntrevistasCandidato() {
  const router = useRouter();
  const [entrevistas, setEntrevistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [horarioAlt, setHorarioAlt] = useState({});

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      router.push('/candidato/login');
      return;
    }
    const { data } = await supabase
      .from('entrevistas')
      .select('*, postulaciones(vacante_id, vacantes(puesto, empleadores(nombre_local, contacto)))')
      .eq('postulaciones.candidato_id', uid)
      .order('created_at', { ascending: false });
    setEntrevistas((data || []).filter((e) => e.postulaciones));
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function responder(id, estado) {
    await supabase.from('entrevistas').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
    cargar();
  }

  async function proponerReagendar(id) {
    const nuevoHorario = horarioAlt[id];
    if (!nuevoHorario) return;
    await supabase.from('entrevistas').update({
      horario_alternativo: nuevoHorario,
      estado: 'reagendar_propuesto',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    cargar();
  }

  if (cargando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <div>
          <a className="nav-link" href="/candidato/panel">Mi panel</a>
          <a className="nav-link" href="/candidato/vacantes">Vacantes</a>
        </div>
      </div>
      <div className="container">
        <h1>Mis entrevistas</h1>
        {entrevistas.length === 0 && <p>Todavía no tenés propuestas de entrevista.</p>}
        {entrevistas.map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 16 }}>
            <h3>{e.postulaciones.vacantes.puesto} — {e.postulaciones.vacantes.empleadores.nombre_local}</h3>
            <p>Horario propuesto: <strong>{new Date(e.horario_propuesto).toLocaleString('es-AR')}</strong></p>
            <p>Estado: <span className="badge medio">{e.estado}</span></p>
            {e.estado === 'pendiente' && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn" onClick={() => responder(e.id, 'confirmada')}>Confirmar</button>
                <button className="btn secundario" onClick={() => responder(e.id, 'rechazada')}>Rechazar</button>
                <input
                  type="datetime-local"
                  onChange={(ev) => setHorarioAlt((s) => ({ ...s, [e.id]: ev.target.value }))}
                />
                <button className="btn mostaza" onClick={() => proponerReagendar(e.id)}>Proponer otro horario</button>
              </div>
            )}
            {e.estado === 'confirmada' && (
              <div>
                <p>Contacto del local: <strong>{e.postulaciones.vacantes.empleadores.contacto}</strong></p>
                {linkWhatsApp(
                  e.postulaciones.vacantes.empleadores.contacto,
                  `Hola, soy candidato en Matchy para el puesto de ${e.postulaciones.vacantes.puesto}. Confirmo la entrevista.`
                ) && (
                  <a
                    className="btn blanco"
                    href={linkWhatsApp(
                      e.postulaciones.vacantes.empleadores.contacto,
                      `Hola, soy candidato en Matchy para el puesto de ${e.postulaciones.vacantes.puesto}. Confirmo la entrevista.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Escribir por WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
