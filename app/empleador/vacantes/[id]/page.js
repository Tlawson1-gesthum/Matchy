'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { calcularPuntaje } from '../../../../lib/scoring';
import { etiqueta, TURNOS, URGENCIAS, DIAS_TRABAJO } from '../../../../lib/opciones';
import { linkWhatsApp } from '../../../../lib/whatsapp';

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
  const [error, setError] = useState('');

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) { router.push('/empleador/login'); return; }

    const { data: vac, error: errVac } = await supabase
      .from('vacantes').select('*').eq('id', params.id).single();
    if (errVac || !vac) {
      setError('No encontramos esta vacante.');
      setCargando(false);
      return;
    }
    setVacante(vac);

    // Paso 1: las postulaciones (sin traer el CV embebido, porque no hay
    // relación directa entre postulaciones y cvs que la base sepa resolver).
    const { data: posts, error: errPost } = await supabase
      .from('postulaciones')
      .select('*')
      .eq('vacante_id', params.id);

    if (errPost) {
      setError('No pudimos cargar los postulantes: ' + errPost.message);
      setCargando(false);
      return;
    }

    if (!posts || posts.length === 0) {
      setPostulaciones([]);
      setCargando(false);
      return;
    }

    // Paso 2: los CVs de esos candidatos, en una sola consulta.
    const ids = posts.map((p) => p.candidato_id);
    const { data: cvs } = await supabase.from('cvs').select('*').in('id', ids);
    const porId = Object.fromEntries((cvs || []).map((c) => [c.id, c]));

    // Paso 3: las entrevistas ya propuestas.
    const { data: entrevistas } = await supabase
      .from('entrevistas')
      .select('*')
      .in('postulacion_id', posts.map((p) => p.id));

    const conPuntaje = posts.map((p) => {
      const cv = porId[p.candidato_id] || {};
      const { puntaje, razonesPositivas, razonesNegativas } = calcularPuntaje(vac, cv);
      return {
        ...p,
        cv,
        entrevista: (entrevistas || []).find((e) => e.postulacion_id === p.id) || null,
        puntaje: p.puntaje || puntaje,
        razonesPositivas,
        razonesNegativas,
      };
    });

    conPuntaje.sort((a, b) => {
      if (a.estado === 'descartado' && b.estado !== 'descartado') return 1;
      if (b.estado === 'descartado' && a.estado !== 'descartado') return -1;
      return b.puntaje - a.puntaje;
    });
    setPostulaciones(conPuntaje);
    setCargando(false);

    const pendientes = conPuntaje.filter((p) => !p.resumen_ia && p.cv.id);
    if (pendientes.length > 0) {
      setProcesandoIA(true);
      for (const p of pendientes) {
        try {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vacante: vac, cv: p.cv, puntaje: p.puntaje,
              razonesPositivas: p.razonesPositivas, razonesNegativas: p.razonesNegativas,
            }),
          });
          const { resumen } = await res.json();
          if (resumen) {
            await supabase.from('postulaciones')
              .update({ puntaje: p.puntaje, resumen_ia: resumen }).eq('id', p.id);
            setPostulaciones((lista) =>
              lista.map((x) => (x.id === p.id ? { ...x, resumen_ia: resumen } : x))
            );
          }
        } catch (e) { /* si falla uno, seguimos con el resto */ }
      }
      setProcesandoIA(false);
    }
  }

  useEffect(() => { cargar(); }, [params.id]);

  async function proponerEntrevista(postulacionId) {
    const horario = horarios[postulacionId];
    if (!horario) return;
    const { error: err } = await supabase.from('entrevistas').insert({
      postulacion_id: postulacionId,
      horario_propuesto: horario,
      propuesta_por: 'empleador',
      estado: 'pendiente',
    });
    if (err) { setError('No se pudo proponer la entrevista: ' + err.message); return; }
    cargar();
  }

  async function cambiarEstado(postulacionId, estado) {
    const { error: err } = await supabase
      .from('postulaciones').update({ estado }).eq('id', postulacionId);
    if (err) { setError('No se pudo actualizar: ' + err.message); return; }
    setPostulaciones((lista) =>
      lista.map((x) => (x.id === postulacionId ? { ...x, estado } : x))
    );
  }

  async function exportarExcel() {
    const XLSX = await import('xlsx');
    const filas = postulaciones.map((p) => ({
      Candidato: p.cv.nombre || '(sin nombre)',
      Puntaje: p.puntaje,
      'Años de experiencia': p.cv.anios_experiencia || 0,
      Contacto: p.cv.contacto || '',
      Ciudad: p.cv.ciudad || '',
      'Resumen IA': p.resumen_ia || '',
      'A favor': (p.razonesPositivas || []).join('; '),
      'En contra': (p.razonesNegativas || []).join('; '),
      'Se postula como': p.puesto_otro || '',
      Estado: p.estado === 'descartado' ? 'Descartado' : p.estado === 'preseleccionado' ? 'Preseleccionado' : 'Postulado',
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Ranking');
    XLSX.writeFile(libro, `matchy-ranking-${vacante.puesto}.xlsx`);
  }

  if (cargando) return <div className="container">Cargando...</div>;

  if (!vacante) {
    return (
      <div>
        <div className="navbar"><a className="logo" href="/">Matchy</a></div>
        <div className="container"><p>{error}</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
        <a className="nav-link" href="/empleador/vacantes">Mis vacantes</a>
      </div>
      <div className="container">
        <h1>{vacante.puesto === 'Otro' && vacante.puesto_otro ? vacante.puesto_otro : vacante.puesto}</h1>
        <p className="mono" style={{ fontSize: '0.85rem' }}>
          Turno: {etiqueta(TURNOS, vacante.turno) || 'a definir'} ·{' '}
          {etiqueta(DIAS_TRABAJO, vacante.dias_trabajo) || 'días a definir'} ·{' '}
          Urgencia: {etiqueta(URGENCIAS, vacante.urgencia)} · Estado: {vacante.estado}
        </p>

        {error && <p style={{ color: '#B5432A' }}>{error}</p>}

        <div style={{ margin: '16px 0' }}>
          <button className="btn blanco" onClick={exportarExcel} disabled={postulaciones.length === 0}>
            Exportar ranking a Excel
          </button>
          {procesandoIA && <span style={{ marginLeft: 12 }}>Generando resúmenes...</span>}
        </div>

        {postulaciones.length === 0 && <p>Todavía no hay postulantes.</p>}

        {postulaciones.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ marginBottom: 16, opacity: p.estado === 'descartado' ? 0.5 : 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{p.cv.nombre || 'Candidato sin nombre cargado'}</h3>
                <span className={`badge ${badgeClase(p.puntaje)}`}>{p.puntaje}/100 de match</span>
                {p.puesto_otro && <p style={{ margin: '6px 0 0' }}>Se postula como: <strong>{p.puesto_otro}</strong></p>}
                <p style={{ margin: '8px 0' }}>{p.resumen_ia || 'Analizando el perfil...'}</p>
                <p className="mono" style={{ fontSize: '0.78rem' }}>
                  {p.cv.anios_experiencia || 0} años de experiencia · {p.cv.ciudad || 'Posadas'} · {p.cv.contacto || 'sin contacto'}
                </p>
              </div>
              {p.cv.id && (
                <a className="btn blanco" href={`/cv/${p.cv.id}`} target="_blank" rel="noreferrer">Ver CV</a>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              {p.estado === 'descartado' ? (
                <button className="btn blanco" onClick={() => cambiarEstado(p.id, 'postulado')}>
                  Volver a considerar
                </button>
              ) : (
                <button className="btn blanco" onClick={() => cambiarEstado(p.id, 'descartado')}>
                  No me interesa
                </button>
              )}
            </div>

            {p.entrevista ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: 0 }}>
                  Entrevista: <strong>{new Date(p.entrevista.horario_propuesto).toLocaleString('es-AR')}</strong>
                  {' '}— <span className="badge medio">{p.entrevista.estado}</span>
                </p>
                {linkWhatsApp(
                  p.cv.contacto,
                  `Hola ${p.cv.nombre || ''}, te escribo por Matchy: te propuse una entrevista para el puesto de ${vacante.puesto}.`
                ) && (
                  <a
                    className="btn blanco"
                    style={{ marginTop: 10 }}
                    href={linkWhatsApp(
                      p.cv.contacto,
                      `Hola ${p.cv.nombre || ''}, te escribo por Matchy: te propuse una entrevista para el puesto de ${vacante.puesto}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Avisarle por WhatsApp
                  </a>
                )}
              </div>
            ) : p.estado === 'descartado' ? null : (
              <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="datetime-local" onChange={(e) => setHorarios((s) => ({ ...s, [p.id]: e.target.value }))} />
                <button className="btn" onClick={() => proponerEntrevista(p.id)}>Proponer entrevista</button>
              </div>
            )}
          </div>
        ))}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
