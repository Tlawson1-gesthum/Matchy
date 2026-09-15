'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function VacantesCandidato() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [vacantes, setVacantes] = useState([]);
  const [postuladas, setPostuladas] = useState(new Set());
  const [filtroPuesto, setFiltroPuesto] = useState('');
  const [detalleOtro, setDetalleOtro] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.push('/candidato/login');
        return;
      }
      setUserId(uid);

      const { data: vac } = await supabase
        .from('vacantes')
        .select('*, empleadores(nombre_local, tipo_local, ciudad)')
        .eq('estado', 'activa')
        .order('created_at', { ascending: false });
      setVacantes(vac || []);

      const { data: post } = await supabase
        .from('postulaciones')
        .select('vacante_id')
        .eq('candidato_id', uid);
      setPostuladas(new Set((post || []).map((p) => p.vacante_id)));

      setCargando(false);
    }
    cargar();
  }, [router]);

  async function postularse(vacanteId, puestoOtro) {
    const { error } = await supabase.from('postulaciones').insert({
      vacante_id: vacanteId,
      candidato_id: userId,
      puesto_otro: puestoOtro || null,
    });
    if (!error) {
      setPostuladas((s) => new Set([...s, vacanteId]));
      setDetalleOtro((d) => ({ ...d, [vacanteId]: '' }));
    }
  }

  const vacantesFiltradas = filtroPuesto
    ? vacantes.filter((v) => v.puesto === filtroPuesto)
    : vacantes;

  const puestosDisponibles = [...new Set(vacantes.map((v) => v.puesto))];

  if (cargando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <div>
          <a className="nav-link" href="/candidato/mi-perfil">Mi perfil</a>
          <a className="nav-link" href="/candidato/entrevistas">Mis entrevistas</a>
        </div>
      </div>
      <div className="container">
        <h1>Vacantes activas</h1>
        <div className="form-field" style={{ maxWidth: 260 }}>
          <label>Filtrar por puesto</label>
          <select value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)}>
            <option value="">Todos</option>
            {puestosDisponibles.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {vacantesFiltradas.length === 0 && <p>No hay vacantes activas por ahora.</p>}

        {vacantesFiltradas.map((v) => (
          <div key={v.id} className="card" style={{ marginBottom: 16 }}>
            <h3>{v.puesto === 'Otro' && v.puesto_otro ? v.puesto_otro : v.puesto} — {v.empleadores?.nombre_local}</h3>
            <p className="mono" style={{ fontSize: '0.85rem' }}>
              {v.empleadores?.tipo_local} · {v.empleadores?.ciudad} · Turno: {v.turno || 'a definir'} · Urgencia: {v.urgencia}
            </p>
            <p>{v.descripcion}</p>
            <p style={{ fontSize: '0.85rem' }}>
              Experiencia mínima: {v.experiencia_minima_anios || 0} años
              {v.movilidad_requerida && ' · Requiere movilidad propia'}
              {v.certificado_requerido && ' · Requiere certificado de manipulación'}
            </p>
            {postuladas.has(v.id) ? (
              <span className="badge alto">Ya te postulaste</span>
            ) : v.puesto === 'Otro' ? (
              <div>
                <div className="form-field" style={{ maxWidth: 380 }}>
                  <label>Contanos a qué puesto te postulás</label>
                  <input
                    value={detalleOtro[v.id] || ''}
                    onChange={(e) => setDetalleOtro((d) => ({ ...d, [v.id]: e.target.value }))}
                  />
                </div>
                <button
                  className="btn"
                  disabled={!detalleOtro[v.id]}
                  onClick={() => postularse(v.id, detalleOtro[v.id])}
                >
                  Postularme
                </button>
              </div>
            ) : (
              <button className="btn" onClick={() => postularse(v.id)}>Postularme</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
