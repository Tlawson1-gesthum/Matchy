'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { calcularPuntaje } from '../../../../lib/scoring';
import { etiqueta, TURNOS, URGENCIAS, DIAS_TRABAJO } from '../../../../lib/opciones';
import { linkWhatsApp } from '../../../../lib/whatsapp';
import { rutaCertificado } from '../../../../lib/archivos';
import { enviarAviso } from '../../../../lib/avisos';
import { formatearHorario, horarioParaGuardar, minimoSelector } from '../../../../lib/fechas';
import { traducirError } from '../../../../lib/errores';
import BotonWhatsApp from '../../../../components/BotonWhatsApp';
import GuardiaRol from '../../../../components/GuardiaRol';
import { useDialogo } from '../../../../components/Dialogo';
import Encabezado from '../../../../components/Encabezado';
import Pie from '../../../../components/Pie';
import PantallaCarga from '../../../../components/PantallaCarga';

const ESTADOS_ENTREVISTA = {
  pendiente: 'esperando respuesta del candidato',
  confirmada: 'confirmada',
  rechazada: 'el candidato no puede',
  reagendar_propuesto: 'el candidato propuso otro horario',
};

function badgeClase(puntaje) {
  if (puntaje >= 70) return 'alto';
  if (puntaje >= 40) return 'medio';
  return 'bajo';
}

function RankingVacanteContenido({ params }) {
  const { dialogo, confirmar, avisar, pedirTexto } = useDialogo();
  const router = useRouter();
  const [vacante, setVacante] = useState(null);
  const [postulaciones, setPostulaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [horarios, setHorarios] = useState({});
  const [error, setError] = useState('');
  const [referencias, setReferencias] = useState({});
  const [accesibilidad, setAccesibilidad] = useState({});

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
    // resumen_ia y las razones son columnas restringidas: se leen a través de
    // esta función, que verifica que la vacante sea del local que llama.
    const { data: posts, error: errPost } = await supabase
      .rpc('postulaciones_para_empleador', { p_vacante_id: params.id });

    if (errPost) {
      setError('No pudimos cargar los postulantes: ' + traducirError(errPost.message));
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
    const { data: cvs } = await supabase.rpc('cvs_para_empleador', { p_ids: ids });
    const porId = Object.fromEntries((cvs || []).map((c) => [c.id, c]));

    // Paso 3: las entrevistas ya propuestas.
    const { data: entrevistas } = await supabase
      .from('entrevistas')
      .select('*')
      .in('postulacion_id', posts.map((p) => p.id));

    const conPuntaje = posts.map((p) => {
      const cvActual = porId[p.candidato_id] || {};
      // El puntaje es el que quedó congelado al postularse. Si la postulación es
      // anterior a esta función, lo calculamos con los datos actuales.
      const base = p.cv_snapshot || cvActual;
      const calculo = calcularPuntaje(vac, base);
      return {
        ...p,
        cv: cvActual,
        cvCongelado: p.cv_snapshot || null,
        entrevista: (entrevistas || []).find((e) => e.postulacion_id === p.id) || null,
        puntaje: p.puntaje != null ? p.puntaje : calculo.puntaje,
        razonesPositivas: p.razones_positivas?.length ? p.razones_positivas : calculo.razonesPositivas,
        razonesNegativas: p.razones_negativas?.length ? p.razones_negativas : calculo.razonesNegativas,
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
      const { data: sesion } = await supabase.auth.getSession();
      const token = sesion?.session?.access_token;
      // De a tres en paralelo: más rápido que de a uno, sin saturar el servicio.
      async function generar(p) {
        try {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ postulacion_id: p.id }),
          });
          if (!res.ok) return;
          const { resumen, puntaje } = await res.json();
          if (resumen) {
            setPostulaciones((lista) =>
              lista.map((x) => (x.id === p.id ? { ...x, resumen_ia: resumen, puntaje: puntaje ?? x.puntaje } : x))
            );
          }
        } catch (e) { /* si falla uno, seguimos con el resto */ }
      }

      if (token) {
        const cola = [...pendientes];
        const trabajadores = Array.from({ length: Math.min(3, cola.length) }, async () => {
          while (cola.length) await generar(cola.shift());
        });
        await Promise.all(trabajadores);
      }
      setProcesandoIA(false);
    }
  }

  useEffect(() => { cargar(); }, [params.id]);

  async function proponerEntrevista(postulacionId) {
    const horario = horarios[postulacionId];
    if (!horario) return;
    const { data: nueva, error: err } = await supabase.from('entrevistas').insert({
      postulacion_id: postulacionId,
      horario_propuesto: horarioParaGuardar(horario),
      propuesta_por: 'empleador',
      estado: 'pendiente',
    }).select('id').single();
    if (err) { setError('No se pudo proponer la entrevista: ' + traducirError(err.message)); return; }
    enviarAviso('entrevista_propuesta', nueva?.id);
    cargar();
  }

  async function cambiarEstado(postulacionId, estado) {
    const { error: err } = await supabase
      .from('postulaciones').update({ estado }).eq('id', postulacionId);
    if (err) { setError('No se pudo actualizar: ' + traducirError(err.message)); return; }
    setPostulaciones((lista) =>
      lista.map((x) => (x.id === postulacionId ? { ...x, estado } : x))
    );
  }

  async function responderEntrevista(entrevistaId, estado, horario) {
    const cambios = { estado, updated_at: new Date().toISOString() };
    if (horario) {
      cambios.horario_propuesto = horarioParaGuardar(horario);
      cambios.horario_alternativo = null;
      cambios.estado = 'pendiente';
      cambios.propuesta_por = 'empleador';
    }
    const { error: err } = await supabase.from('entrevistas').update(cambios).eq('id', entrevistaId);
    if (err) { setError('No se pudo actualizar la entrevista: ' + traducirError(err.message)); return; }
    if (horario) enviarAviso('entrevista_actualizada', entrevistaId);
    cargar();
  }

  async function aceptarHorarioAlternativo(entrevista) {
    const { error: err } = await supabase.from('entrevistas').update({
      horario_propuesto: entrevista.horario_alternativo,
      horario_alternativo: null,
      estado: 'confirmada',
      updated_at: new Date().toISOString(),
    }).eq('id', entrevista.id);
    if (err) { setError('No se pudo confirmar: ' + traducirError(err.message)); return; }
    enviarAviso('entrevista_actualizada', entrevista.id);
    cargar();
  }

  async function preseleccionar(postulacion) {
    const { error: err } = await supabase
      .from('postulaciones').update({ estado: 'preseleccionado' }).eq('id', postulacion.id);
    if (err) { setError('No se pudo preseleccionar: ' + traducirError(err.message)); return; }

    setPostulaciones((lista) =>
      lista.map((x) => (x.id === postulacion.id ? { ...x, estado: 'preseleccionado' } : x))
    );

    const { data, error: errRef } = await supabase
      .rpc('referencias_de_candidato', { p_candidato_id: postulacion.candidato_id });
    if (!errRef) {
      setReferencias((r) => ({ ...r, [postulacion.candidato_id]: data || [] }));
    }
    const { data: acc } = await supabase
      .rpc('accesibilidad_de_candidato', { p_candidato_id: postulacion.candidato_id });
    setAccesibilidad((a) => ({ ...a, [postulacion.candidato_id]: acc || null }));
  }

  async function verReferencias(postulacion) {
    const { data, error: errRef } = await supabase
      .rpc('referencias_de_candidato', { p_candidato_id: postulacion.candidato_id });
    if (errRef) { setError('No se pudieron cargar las referencias: ' + traducirError(errRef.message)); return; }
    setReferencias((r) => ({ ...r, [postulacion.candidato_id]: data || [] }));
    const { data: acc } = await supabase
      .rpc('accesibilidad_de_candidato', { p_candidato_id: postulacion.candidato_id });
    setAccesibilidad((a) => ({ ...a, [postulacion.candidato_id]: acc || null }));
  }

  async function verCertificado(cv) {
    const ruta = rutaCertificado(cv.certificado_url);
    if (!ruta) return;
    const { data, error: err } = await supabase.storage.from('certificados').createSignedUrl(ruta, 300);
    if (err || !data?.signedUrl) {
      setError('No se pudo abrir el certificado. Solo está disponible después de avanzar con la persona.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
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
    XLSX.writeFile(libro, `voral-ranking-${vacante.puesto}.xlsx`);
  }

  if (cargando) return <PantallaCarga texto="Ordenando postulantes..." />;

  if (!vacante) {
    return (
      <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }, { href: '/empleador/mi-local', texto: 'Mi local' }]} campanaHref="/empleador/vacantes" />
        <div className="container"><p>{error}</p></div>
      </div>
    );
  }

  return (
    <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }, { href: '/empleador/mi-local', texto: 'Mi local' }]} campanaHref="/empleador/vacantes" />
      {dialogo}
      <div className="container">
        <h1>{vacante.puesto === 'Otro' && vacante.puesto_otro ? vacante.puesto_otro : vacante.puesto}</h1>
        <p className="mono" style={{ fontSize: '0.85rem' }}>
          Turno: {etiqueta(TURNOS, vacante.turno) || 'a definir'} ·{' '}
          {etiqueta(DIAS_TRABAJO, vacante.dias_trabajo) || 'días a definir'} ·{' '}
          Urgencia: {etiqueta(URGENCIAS, vacante.urgencia)} · Estado: {vacante.estado}
        </p>

        {error && <p className="mensaje-error" role="alert">{error}</p>}

        <div style={{ margin: '16px 0' }}>
          <button className="btn blanco" onClick={exportarExcel} disabled={postulaciones.length === 0}>
            Exportar ranking a Excel
          </button>
          {procesandoIA && <span style={{ marginLeft: 12 }}>Generando resúmenes...</span>}
        </div>

        <div className="aviso-legal">
          <strong>Cómo leer este orden.</strong> El porcentaje compara los datos del CV con los requisitos que
          cargaste en la vacante. Es una ayuda para priorizar la lectura, no una evaluación de la persona ni de su
          idoneidad: la decisión de entrevistar y contratar es tuya y tiene que tomarla una persona, revisando cada
          perfil. Recordá que la Ley 23.592 y la Ley de Contrato de Trabajo prohíben seleccionar por motivos
          discriminatorios como edad, sexo, nacionalidad, apariencia, religión, ideología o situación familiar.
          <p style={{ margin: '10px 0 0' }}>
            El porcentaje se calcula con el CV tal como estaba cuando la persona se postuló, y queda congelado:
            editarlo después no modifica su posición. Si alguien modificó su CV más tarde, te lo avisamos debajo de
            su nombre.
          </p>
          <p style={{ margin: '10px 0 0' }}>
            Ningún cálculo reemplaza la verificación: confirmá la experiencia en la entrevista y con las
            referencias. Voral no participa de las entrevistas ni de la contratación, y no responde por lo que
            ocurra entre vos y los candidatos.
          </p>
        </div>

        {postulaciones.length === 0 && (
          <div className="card tarjeta-bienvenida-vacio">
            <h2>Todavía no hay postulantes</h2>
            <p>En cuanto alguien se postule a esta vacante, va a aparecer acá con su porcentaje de compatibilidad.</p>
          </div>
        )}

        {postulaciones.map((p) => (
          <div
            key={p.id}
            className="card tarjeta-postulante"
            style={{ marginBottom: 16, opacity: p.estado === 'descartado' ? 0.5 : 1 }}
          >
            <div className="postulante-cabecera">
              <div>
                <h3 style={{ marginBottom: 4 }}>{p.cv.nombre || 'Candidato sin nombre cargado'}</h3>
                <span className={`badge ${badgeClase(p.puntaje)}`}>{p.puntaje}/100 de match</span>
                {p.puesto_otro && <p style={{ margin: '6px 0 0' }}>Se postula como: <strong>{p.puesto_otro}</strong></p>}
                <p style={{ margin: '8px 0' }}>{p.resumen_ia || 'Analizando el perfil...'}</p>
                <p className="mono" style={{ fontSize: '0.78rem' }}>
                  {p.cv.anios_experiencia || 0} años de experiencia · {p.cv.ciudad || 'Posadas'} · {p.cv.contacto || 'sin contacto'}
                </p>
                {p.cv_editado_despues && (
                  <p className="marca-editado">
                    Modificó su CV después de postularse. El porcentaje corresponde al CV del momento de la
                    postulación; el enlace "Ver CV" muestra la versión actual.
                  </p>
                )}
              </div>
              {p.cv.id && (
                <a className="btn-contorno-rect" href={`/cv/${p.cv.id}`} target="_blank" rel="noreferrer">Ver CV<span className="solo-lector"> de {p.cv.nombre || 'la persona'} (se abre en otra pestaña)</span></a>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              {p.estado === 'descartado' ? (
                <button className="btn-accion" onClick={() => cambiarEstado(p.id, 'postulado')}>
                  Volver a considerar
                </button>
              ) : (
                <>
                  {p.estado !== 'preseleccionado' && (
                    <button className="btn-accion" onClick={() => preseleccionar(p)}>
                      Avanzar con esta persona
                    </button>
                  )}
                  {p.estado === 'preseleccionado' && !referencias[p.candidato_id] && (
                    <button className="btn-accion" onClick={() => verReferencias(p)}>
                      Ver referencias
                    </button>
                  )}
                  <button className="btn-accion quitar" onClick={() => cambiarEstado(p.id, 'descartado')}>
                    No me interesa
                  </button>
                </>
              )}
            </div>
            <p className="ficha-nota" style={{ margin: '8px 0 0' }}>
              La persona ve si avanzás con ella. Si elegís "No me interesa", se entera recién cuando marcás la
              vacante como cubierta.
            </p>

            {referencias[p.candidato_id] && (
              <div className="aviso-legal" style={{ marginTop: 12 }}>
                <strong>Referencias declaradas por el candidato</strong>
                {referencias[p.candidato_id].length === 0 ? (
                  <p style={{ margin: '8px 0 0' }}>No cargó contactos de referencia.</p>
                ) : (
                  referencias[p.candidato_id].map((r, i) => (
                    <p key={i} style={{ margin: '8px 0 0' }}>
                      {r.ref_nombre}
                      {r.ref_relacion ? `, ${r.ref_relacion}` : ''}
                      {r.empresa ? ` en ${r.empresa}` : ''}
                      {r.ref_email ? ` · ${r.ref_email}` : ''}
                      {r.ref_celular ? ` · ${r.ref_celular}` : ''}
                    </p>
                  ))
                )}
                {p.cv.certificado_url && (
                  <p style={{ margin: '10px 0 0' }}>
                    <button className="btn-accion" onClick={() => verCertificado(p.cv)}>
                      Ver certificado de manipulación
                    </button>
                  </p>
                )}
                {accesibilidad[p.candidato_id]?.tiene_discapacidad && (
                  <p style={{ margin: '10px 0 0' }}>
                    <strong>Accesibilidad:</strong>{' '}
                    {(accesibilidad[p.candidato_id].tipos_discapacidad || []).join(', ') || 'declara tener una discapacidad'}
                    {accesibilidad[p.candidato_id].posee_cud ? ' · posee CUD' : ''}
                  </p>
                )}
                <p className="ayuda-contraste" style={{ marginTop: 10 }}>
                  Usá estos contactos y el certificado solo para verificar esta postulación.
                </p>
              </div>
            )}

            {p.entrevista ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: 0 }}>
                  Entrevista: <strong>{formatearHorario(p.entrevista.horario_propuesto)}</strong>
                  {' '}<span className="badge medio">{ESTADOS_ENTREVISTA[p.entrevista.estado] || p.entrevista.estado}</span>
                </p>

                {p.entrevista.estado === 'reagendar_propuesto' && (
                  <div className="aviso-reagendar">
                    <p style={{ margin: '0 0 10px' }}>
                      El candidato no puede en ese horario y propone{' '}
                      <strong>{formatearHorario(p.entrevista.horario_alternativo)}</strong>.
                    </p>
                    <div className="fila-proponer">
                      <button className="btn-oxido-solido" onClick={() => aceptarHorarioAlternativo(p.entrevista)}>
                        Aceptar ese horario
                      </button>
                      <input
                        type="datetime-local"
                        min={minimoSelector()}
                        onChange={(e) => setHorarios((s) => ({ ...s, [`re-${p.entrevista.id}`]: e.target.value }))}
                      />
                      <button
                        className="btn-accion"
                        disabled={!horarios[`re-${p.entrevista.id}`]}
                        onClick={() => responderEntrevista(p.entrevista.id, 'pendiente', horarios[`re-${p.entrevista.id}`])}
                      >
                        Proponer otro horario
                      </button>
                      <button
                        className="btn-accion"
                        onClick={async () => {
                          const ok = await confirmar('Se cancela la entrevista propuesta.', {
                            titulo: `¿Descartar a ${p.cv.nombre || 'esta persona'}?`,
                            textoAceptar: 'Descartar',
                            peligro: true,
                          });
                          if (ok) {
                            responderEntrevista(p.entrevista.id, 'rechazada');
                            cambiarEstado(p.id, 'descartado');
                          }
                        }}
                      >
                        Descartar candidato
                      </button>
                    </div>
                  </div>
                )}

                {p.entrevista.estado === 'rechazada' && (
                  <div className="aviso-reagendar">
                    <p style={{ margin: '0 0 10px' }}>El candidato no puede asistir.</p>
                    <div className="fila-proponer">
                      <input
                        type="datetime-local"
                        min={minimoSelector()}
                        onChange={(e) => setHorarios((s) => ({ ...s, [`re-${p.entrevista.id}`]: e.target.value }))}
                      />
                      <button
                        className="btn-oxido-solido"
                        disabled={!horarios[`re-${p.entrevista.id}`]}
                        onClick={() => responderEntrevista(p.entrevista.id, 'pendiente', horarios[`re-${p.entrevista.id}`])}
                      >
                        Proponer otra fecha
                      </button>
                      <button className="btn-accion quitar" onClick={() => cambiarEstado(p.id, 'descartado')}>
                        Descartar candidato
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <BotonWhatsApp href={linkWhatsApp(p.cv.contacto, `Hola ${p.cv.nombre || ''}, te escribo por Voral: te propuse una entrevista para el puesto de ${vacante.puesto}.`)} texto="Avisarle por WhatsApp" />
                </div>
              </div>
            ) : p.estado === 'descartado' ? null : (
              <div className="fila-proponer">
                <input type="datetime-local" min={minimoSelector()} onChange={(e) => setHorarios((s) => ({ ...s, [p.id]: e.target.value }))} />
                <button className="btn-oxido-solido" onClick={() => proponerEntrevista(p.id)}>Proponer entrevista</button>
              </div>
            )}
          </div>
        ))}
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

export default function RankingVacante(props) {
  return (
    <GuardiaRol rol="empleador">
      <RankingVacanteContenido {...props} />
    </GuardiaRol>
  );
}
