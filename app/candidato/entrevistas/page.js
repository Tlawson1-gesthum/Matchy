'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { linkWhatsApp } from '../../../lib/whatsapp';
import { formatearHorario, horarioParaGuardar, minimoSelector } from '../../../lib/fechas';
import BotonWhatsApp from '../../../components/BotonWhatsApp';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

const ESTADOS = {
  pendiente: 'Esperando tu respuesta',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  reagendar_propuesto: 'Propusiste otro horario',
};

function EntrevistasCandidatoContenido() {
  const router = useRouter();
  const [entrevistas, setEntrevistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [horarioAlt, setHorarioAlt] = useState({});
  const [proponiendo, setProponiendo] = useState(null); // id de la entrevista con el selector abierto

  async function cargar() {
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) { router.push('/candidato/login'); return; }

    // Paso 1: mis postulaciones
    const { data: posts, error: errPost } = await supabase
      .from('postulaciones').select('*').eq('candidato_id', uid);
    if (errPost) { setError(errPost.message); setCargando(false); return; }

    if (!posts || posts.length === 0) {
      setEntrevistas([]);
      setCargando(false);
      return;
    }

    // Paso 2: las entrevistas de esas postulaciones
    const { data: ents, error: errEnt } = await supabase
      .from('entrevistas').select('*')
      .in('postulacion_id', posts.map((p) => p.id))
      .order('created_at', { ascending: false });
    if (errEnt) { setError(errEnt.message); setCargando(false); return; }

    if (!ents || ents.length === 0) {
      setEntrevistas([]);
      setCargando(false);
      return;
    }

    // Paso 3: las vacantes involucradas
    const idsVacantes = [...new Set(posts.map((p) => p.vacante_id))];
    const { data: vacs } = await supabase.from('vacantes').select('*').in('id', idsVacantes);
    const vacPorId = Object.fromEntries((vacs || []).map((v) => [v.id, v]));

    // Paso 4: los locales de esas vacantes
    const idsLocales = [...new Set((vacs || []).map((v) => v.empleador_id))];
    const { data: locales } = idsLocales.length
      ? await supabase.from('empleadores').select('*').in('id', idsLocales)
      : { data: [] };
    const localPorId = Object.fromEntries((locales || []).map((e) => [e.id, e]));

    // Armamos cada fila solo con lo que realmente llegó
    const armadas = ents.map((e) => {
      const post = posts.find((p) => p.id === e.postulacion_id) || null;
      const vac = post ? vacPorId[post.vacante_id] : null;
      const local = vac ? localPorId[vac.empleador_id] : null;
      return { ...e, vacante: vac, local };
    });

    setEntrevistas(armadas);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function responder(id, estado) {
    if (estado === 'rechazada') {
      const ok = window.confirm(
        '¿Seguro que no podés ir? El local va a ver que rechazaste la entrevista. Si el problema es el horario, mejor proponé otro.'
      );
      if (!ok) return;
    }
    const { error: err } = await supabase
      .from('entrevistas').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError('No se pudo guardar tu respuesta: ' + err.message); return; }
    cargar();
  }

  async function proponerReagendar(id) {
    const nuevoHorario = horarioAlt[id];
    if (!nuevoHorario) return;
    const { error: err } = await supabase.from('entrevistas').update({
      horario_alternativo: horarioParaGuardar(nuevoHorario),
      estado: 'reagendar_propuesto',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (err) { setError('No se pudo proponer el horario: ' + err.message); return; }
    setProponiendo(null);
    cargar();
  }

  if (cargando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/panel', texto: 'Mi panel' }, { href: '/candidato/vacantes', texto: 'Vacantes' }]} campanaHref="/candidato/entrevistas" />

      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Mis entrevistas</h1>
        {error && <p className="mensaje-error" role="alert">{error}</p>}

        <div className="aviso-legal">
          <strong>Cuidate en la entrevista.</strong> Las entrevistas se hacen en el local y en horario comercial.
          Nadie puede pedirte dinero, tus claves bancarias ni que trabajes gratis a modo de prueba. Contale a
          alguien de confianza adónde vas. Matchy coordina el contacto pero no participa de la entrevista ni
          responde por lo que ocurra en ella: si algo te resulta raro, no vayas y escribinos a{' '}
          <a href="mailto:gozzasabores@gmail.com">gozzasabores@gmail.com</a>.
        </div>

        {entrevistas.length === 0 && (
          <div className="card">
            <p style={{ marginTop: 0 }}>Todavía no tenés propuestas de entrevista.</p>
            <p style={{ marginBottom: 0 }}>
              Las entrevistas las propone el local cuando ve tu perfil.{' '}
              <a href="/candidato/vacantes">Postulate a más vacantes</a> para aparecer en más listas.
            </p>
          </div>
        )}

        {entrevistas.map((e) => {
          const puesto = e.vacante
            ? (e.vacante.puesto === 'Otro' && e.vacante.puesto_otro ? e.vacante.puesto_otro : e.vacante.puesto)
            : 'Puesto no disponible';
          const nombreLocal = e.local?.nombre_local || 'Local no disponible';
          const mensajeWpp = `Hola, te escribo por Matchy: confirmo la entrevista para el puesto de ${puesto}.`;
          const wpp = e.local?.contacto ? linkWhatsApp(e.local.contacto, mensajeWpp) : null;

          return (
            <div key={e.id} className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 4 }}>{puesto}</h3>
              <p className="mono" style={{ fontSize: '0.78rem', margin: 0 }}>{nombreLocal}</p>

              <p style={{ marginTop: 12 }}>
                Horario propuesto:{' '}
                <strong>{formatearHorario(e.horario_propuesto)}</strong>
              </p>
              {e.horario_alternativo && (
                <p style={{ margin: '4px 0' }}>
                  Tu propuesta alternativa:{' '}
                  <strong>{formatearHorario(e.horario_alternativo)}</strong>
                </p>
              )}
              <p><span className="badge medio">{ESTADOS[e.estado] || e.estado}</span></p>

              {e.estado === 'pendiente' && e.propuesta_por === 'empleador' && (
                <p className="ayuda-contraste">
                  El local propuso este horario. Respondé para confirmar la entrevista.
                </p>
              )}

              {e.estado === 'reagendar_propuesto' && (
                <p className="ayuda-contraste">
                  Propusiste otro horario. El local tiene que confirmarlo.
                </p>
              )}

              {e.estado === 'pendiente' && (
                <>
                  <div className="botonera-entrevista">
                    <button className="btn-verde-solido en-linea" onClick={() => responder(e.id, 'confirmada')}>
                      Confirmar
                    </button>
                    <button
                      className="btn-accion"
                      aria-expanded={proponiendo === e.id}
                      aria-controls={`proponer-${e.id}`}
                      onClick={() => setProponiendo(proponiendo === e.id ? null : e.id)}
                    >
                      Proponer otro horario
                    </button>
                    <button className="btn-accion quitar" onClick={() => responder(e.id, 'rechazada')}>
                      No puedo ir
                    </button>
                  </div>

                  {proponiendo === e.id && (
                    <div className="panel-proponer" id={`proponer-${e.id}`}>
                      <label htmlFor={`horario-${e.id}`}>¿Qué día y horario te queda bien?</label>
                      <input
                        id={`horario-${e.id}`}
                        type="datetime-local"
                        min={minimoSelector()}
                        value={horarioAlt[e.id] || ''}
                        onChange={(ev) => setHorarioAlt((s) => ({ ...s, [e.id]: ev.target.value }))}
                      />
                      <div className="botonera-entrevista">
                        <button
                          className="btn-verde-solido en-linea"
                          disabled={!horarioAlt[e.id]}
                          onClick={() => proponerReagendar(e.id)}
                        >
                          Enviar propuesta
                        </button>
                        <button className="btn-accion" onClick={() => setProponiendo(null)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {e.estado === 'confirmada' && (
                <div>
                  {e.local?.direccion && <p style={{ margin: '4px 0' }}>Dirección: {e.local.direccion}</p>}
                  {e.local?.contacto && <p style={{ margin: '4px 0' }}>Contacto: <strong>{e.local.contacto}</strong></p>}
                  <BotonWhatsApp href={wpp} />
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

export default function EntrevistasCandidato(props) {
  return (
    <GuardiaRol rol="candidato">
      <EntrevistasCandidatoContenido {...props} />
    </GuardiaRol>
  );
}
