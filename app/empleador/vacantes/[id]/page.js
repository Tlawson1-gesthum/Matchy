'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { calcularPuntaje } from '../../../../lib/scoring';

function badgeClase(puntaje) {
  if (puntaje >= 70) return 'alto';
  if (puntaje >= 40) return 'medio';
  return 'bajo';
}

export default function RankingVacante({ params }) {
  const router = useRouter();
  const [vacante, setVacante] = useState(null);
  const [postulaciones, setPostulaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [horarios, setHorarios] = useState({});

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      router.push('/empleador/login');
      return;
    }

    const { data: vac } = await supabase.from('vacantes').select('*').eq('id', params.id).single();
    setVacante(vac);

    const { data: posts } = await supabase
      .from('postulaciones')
      .select('*, cvs(*), entrevistas(*)')
      .eq('vacante_id', params.id);

    const conPuntaje = (posts || []).map((p) => {
      if (p.puntaje && p.resumen_ia) return p;
      const { puntaje, razonesPositivas, razonesNegativas } = calcularPuntaje(vac, p.cvs);
      return { ...p, puntaje, razonesPositivas, razonesNegativas };
    });

    conPuntaje.sort((a, b) => b.puntaje - a.puntaje);
    setPostulaciones(conPuntaje);
    setCargando(false);

    // Generar resúmenes con IA para los que todavía no lo tienen
    const pendientes = conPuntaje.filter((p) => !p.resumen_ia);
    if (pendientes.length > 0) {
      setProcesandoIA(true);
      for (const p of pendientes) {
        try {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vacante: vac,
              cv: p.cvs,
              puntaje: p.puntaje,
              razonesPositivas: p.razonesPositivas,
              razonesNegativas: p.razonesNegativas,
            }),
          });
          const { resumen } = await res.json();
          if (resumen) {
            await supabase
              .from('postulaciones')
              .update({ puntaje: p.puntaje, resumen_ia: resumen })
              .eq('id', p.id);
          }
        } catch (e) {
          // si falla la IA para un candidato, seguimos con los demás
        }
      }
      setProcesandoIA(false);
      cargar();
    }
  }

  useEffect(() => { cargar(); }, [params.id]);

  async function proponerEntrevista(postulacionId) {
    const horario = horarios[postulacionId];
    if (!horario) return;
    await supabase.from('entrevistas').insert({
      postulacion_id: postulacionId,
      horario_propuesto: horario,
      propuesta_por: 'empleador',
      estado: 'pendiente',
    });
    cargar();
  }

  async function exportarExcel() {
    const XLSX = await import('xlsx');
    const filas = postulaciones.map((p) => ({
      Candidato: p.cvs.nombre,
      Puntaje: p.puntaje,
      'Años de experiencia': p.cvs.anios_experiencia,
      Contacto: p.cvs.contacto,
      Ciudad: p.cvs.ciudad,
      'Resumen IA': p.resumen_ia || '',
      'A favor': (p.razonesPositivas || []).join('; '),
      'En contra': (p.razonesNegativas || []).join('; '),
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Ranking');
    XLSX.writeFile(libro, `matchy-ranking-${vacante.puesto}.xlsx`);
  }

  if (cargando || !vacante) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <a className="nav-link" href="/empleador/vacantes">Mis vacantes</a>
      </div>
      <div className="container">
        <h1>{vacante.puesto}</h1>
        <p className="mono">Turno: {vacante.turno || 'a definir'} · Urgencia: {vacante.urgencia} · Estado: {vacante.estado}</p>

        <div style={{ margin: '16px 0' }}>
          <button className="btn secundario" onClick={exportarExcel} disabled={postulaciones.length === 0}>
            Exportar ranking a Excel
          </button>
          {procesandoIA && <span style={{ marginLeft: 12 }}>Generando resúmenes con IA...</span>}
        </div>

        {postulaciones.length === 0 && <p>Todavía no hay postulantes.</p>}

        {postulaciones.map((p) => (
          <div key={p.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{p.cvs.nombre}</h3>
                <span className={`badge ${badgeClase(p.puntaje)}`}>{p.puntaje}/100</span>
                <p style={{ margin: '8px 0' }}>{p.resumen_ia || 'Calculando resumen...'}</p>
                <p className="mono" style={{ fontSize: '0.8rem' }}>
                  {p.cvs.anios_experiencia} años de experiencia · {p.cvs.ciudad}
                </p>
              </div>
              <a className="btn secundario" href={`/cv/${p.cvs.id}`} target="_blank" rel="noreferrer">Ver CV completo</a>
            </div>

            {p.entrevistas?.length > 0 ? (
              <p style={{ marginTop: 10 }}>
                Entrevista: <strong>{new Date(p.entrevistas[0].horario_propuesto).toLocaleString('es-AR')}</strong>
                {' '}— estado: <span className="badge medio">{p.entrevistas[0].estado}</span>
              </p>
            ) : (
              <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="datetime-local"
                  onChange={(e) => setHorarios((s) => ({ ...s, [p.id]: e.target.value }))}
                />
                <button className="btn" onClick={() => proponerEntrevista(p.id)}>Proponer entrevista</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
