'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { etiqueta, TURNOS, DIAS_TRABAJO, URGENCIAS, DISPONIBILIDAD } from '../../../lib/opciones';
import { calcularPuntaje } from '../../../lib/scoring';
import { traducirError } from '../../../lib/errores';
import { estadoPostulacion } from '../../../lib/estadoPostulacion';
import TickerActividad from '../../../components/TickerActividad';
import TextoFormateado from '../../../components/TextoFormateado';
import GuardiaRol from '../../../components/GuardiaRol';
import { useDialogo } from '../../../components/Dialogo';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';
import CabeceraLocal from '../../../components/CabeceraLocal';

function diasDesde(fecha) {
  const ms = Date.now() - new Date(fecha).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function cuentaRegresiva(cierraAt) {
  if (!cierraAt) return null;
  const ms = new Date(cierraAt).getTime() - Date.now();
  if (ms <= 0) return { texto: 'Cerrada', inminente: true, vencida: true };
  const horas = Math.floor(ms / (1000 * 60 * 60));
  if (horas < 1) {
    const minutos = Math.max(1, Math.floor(ms / (1000 * 60)));
    return { texto: `Cierra en ${minutos} min`, inminente: true };
  }
  if (horas < 24) return { texto: `Cierra en ${horas} ${horas === 1 ? 'hora' : 'horas'}`, inminente: true };
  const dias = Math.floor(horas / 24);
  return { texto: `Cierra en ${dias} ${dias === 1 ? 'día' : 'días'}`, inminente: dias <= 2 };
}

function textoAntiguedad(fecha) {
  const d = diasDesde(fecha);
  if (d <= 0) return 'Publicada hoy';
  if (d === 1) return 'Publicada ayer';
  if (d < 7) return `Publicada hace ${d} días`;
  return `Publicada hace ${Math.floor(d / 7)} semanas`;
}

function VacantesCandidatoContenido() {
  const { dialogo, confirmar, avisar, pedirTexto } = useDialogo();
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [vacantes, setVacantes] = useState([]);
  const [conteos, setConteos] = useState({});
  const [postuladas, setPostuladas] = useState(new Set());
  const [misPostulaciones, setMisPostulaciones] = useState({});
  const [filtroPuesto, setFiltroPuesto] = useState('');
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [detalleOtro, setDetalleOtro] = useState({});
  const [miCv, setMiCv] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vistas, setVistas] = useState({});
  const [actividad, setActividad] = useState(null);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/candidato/login'); return; }
      setUserId(uid);

      const { data: cvPropio } = await supabase.from('cvs').select('*').eq('id', uid).single();
      setMiCv(cvPropio);

      const { data: vac, error: errVac } = await supabase
        .from('vacantes')
        .select('*')
        .eq('estado', 'activa')
        .order('created_at', { ascending: false });

      if (errVac) {
        setError('No pudimos cargar las vacantes: ' + traducirError(errVac.message));
        setCargando(false);
        return;
      }

      // Los datos del local se traen aparte: si esta consulta falla,
      // igual mostramos las vacantes en vez de dejar la pantalla vacía.
      const idsLocales = [...new Set((vac || []).map((v) => v.empleador_id))];
      const { data: locales } = idsLocales.length
        ? await supabase.from('locales_publicos').select('*').in('id', idsLocales)
        : { data: [] };
      const localPorId = Object.fromEntries((locales || []).map((e) => [e.id, e]));

      const conLocal = (vac || []).map((v) => ({ ...v, local: localPorId[v.empleador_id] || null }));
      // Si pudimos leer los locales, mostramos solo los aprobados.
      const visibles = locales && locales.length
        ? conLocal.filter((v) => !v.local || v.local.estado === 'aprobado')
        : conLocal;
      setVacantes(visibles);

      // Cuántos se postularon a cada una (para mostrar competencia real)
      // La función cuenta todas las postulaciones de cada vacante. Antes contábamos las
      // filas visibles para el candidato, que son solo las suyas, y el número salía mal.
      const { data: totales } = await supabase.rpc('conteo_postulaciones');
      const cuenta = {};
      for (const t of totales || []) cuenta[t.vacante_id] = Number(t.total);
      setConteos(cuenta);

      const { data: post } = await supabase
        .from('postulaciones')
        .select('id, vacante_id, candidato_id, puntaje, estado, created_at, puesto_otro, cv_snapshot, cv_editado_despues')
        .eq('candidato_id', uid);
      setPostuladas(new Set((post || []).map((p) => p.vacante_id)));
      setMisPostulaciones(Object.fromEntries((post || []).map((p) => [p.vacante_id, p])));

      // Cerramos las vacantes que ya vencieron antes de mostrar nada
      await supabase.rpc('cerrar_vacantes_vencidas');

      // Vistas reales de los últimos 7 días
      const { data: v7 } = await supabase.rpc('vistas_por_vacante');
      setVistas(Object.fromEntries((v7 || []).map((r) => [r.vacante_id, Number(r.vistas)])));

      // Actividad real de la plataforma
      const { data: act } = await supabase.rpc('actividad_reciente');
      setActividad(act || null);

      // Registramos que esta persona vio estas vacantes hoy (una vez por día)
      if (visibles.length) {
        await supabase.from('vacante_vistas').upsert(
          visibles.map((v) => ({ vacante_id: v.id, usuario_id: uid })),
          { onConflict: 'vacante_id,usuario_id,dia', ignoreDuplicates: true }
        );
      }

      setCargando(false);
    }
    cargar();
  }, [router]);

  async function postularse(vacante, puestoOtro) {
    if (!miCv) return;
    // El puntaje y la copia congelada del CV los arma la base con los datos reales.
    const { data, error } = await supabase.from('postulaciones').insert({
      vacante_id: vacante.id,
      candidato_id: userId,
      puesto_otro: puestoOtro || null,
    }).select().single();

    if (error) {
      await avisar('Puede que la vacante haya cerrado o que ya te hayas postulado. Recargá la página y probá de nuevo.', {
        titulo: 'No pudimos registrar tu postulación',
      });
      return;
    }
    setPostuladas((s) => new Set([...s, vacante.id]));
    setConteos((c) => ({ ...c, [vacante.id]: (c[vacante.id] || 0) + 1 }));
    if (data) setMisPostulaciones((m) => ({ ...m, [vacante.id]: data }));
  }


  async function reportar(vacante) {
    const motivo = await pedirTexto(
      'Contanos qué te resultó sospechoso. Por ejemplo: piden dinero, el local no existe, o piden datos personales que no corresponden.',
      { titulo: 'Reportar este aviso', textoAceptar: 'Enviar reporte', placeholder: 'Qué pasó' }
    );
    if (!motivo) return;
    const { error: err } = await supabase.from('reportes').insert({
      reportante_id: userId,
      vacante_id: vacante.id,
      empleador_id: vacante.empleador_id,
      motivo: motivo.slice(0, 1000),
    });
    if (err) {
      const yaReportado = /duplicate|reportes_uno_por_persona/i.test(err.message || '');
      const limite = /límite de reportes/i.test(err.message || '');
      await avisar(
        yaReportado ? 'Ya habías reportado este aviso. Lo estamos revisando.'
          : limite ? err.message
          : 'No pudimos registrar el reporte. Escribinos a gozzasabores@gmail.com.',
        { titulo: yaReportado ? 'Reporte ya enviado' : 'No se pudo enviar' }
      );
      return;
    }
    await avisar('Vamos a revisar este aviso. Gracias por ayudar a que Voral sea un lugar seguro.', { titulo: 'Reporte enviado' });
  }

  async function retirarPostulacion(vacante) {
    const post = misPostulaciones[vacante.id];
    if (!post) return;
    const ok = await confirmar(
      'El local deja de ver tu postulación. Si ya te propusieron una entrevista, también se cancela. Podés volver a postularte mientras la vacante siga abierta.',
      { titulo: '¿Retirar tu postulación?', textoAceptar: 'Retirar', peligro: true }
    );
    if (!ok) return;
    const { error: err } = await supabase.from('postulaciones').delete().eq('id', post.id);
    if (err) {
      await avisar('No pudimos retirar la postulación. Probá de nuevo en un rato.', { titulo: 'No se pudo retirar' });
      return;
    }
    setPostuladas((s) => { const n = new Set(s); n.delete(vacante.id); return n; });
    setConteos((c) => ({ ...c, [vacante.id]: Math.max(0, (c[vacante.id] || 1) - 1) }));
    setMisPostulaciones((m) => { const n = { ...m }; delete n[vacante.id]; return n; });
  }


  const vacantesFiltradas = vacantes.filter((v) => {
    if (filtroPuesto && v.puesto !== filtroPuesto) return false;
    if (filtroCiudad && v.local?.ciudad !== filtroCiudad) return false;
    return true;
  });
  const ciudadesDisponibles = [...new Set(vacantes.map((v) => v.local?.ciudad).filter(Boolean))];
  const puestosDisponibles = [...new Set(vacantes.map((v) => v.puesto))];

  if (cargando) return <PantallaCarga texto="Buscando vacantes..." />;

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/panel', texto: 'Mi panel' }, { href: '/candidato/mi-perfil', texto: 'Mi CV' }, { href: '/candidato/entrevistas', texto: 'Entrevistas' }]} campanaHref="/candidato/entrevistas" />
      {dialogo}
      <div className="container">
        <h1>Vacantes en Posadas</h1>
        <p>{vacantes.length} {vacantes.length === 1 ? 'local está buscando' : 'locales están buscando'} gente ahora mismo.</p>
        {error && <p className="mensaje-error" role="alert">{error}</p>}

        <TickerActividad datos={actividad} />

        <div className="filtros">
          <div className="form-field">
            <label htmlFor="filtro-puesto">Filtrar por puesto</label>
            <select id="filtro-puesto" value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)}>
              <option value="">Todos</option>
              {puestosDisponibles.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filtro-localidad">Filtrar por localidad</label>
            <select id="filtro-localidad" value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)}>
              <option value="">Todas</option>
              {ciudadesDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {vacantesFiltradas.length === 0 && (
          <div className="card tarjeta-bienvenida-vacio">
            <h2>No hay vacantes para ese filtro</h2>
            <p>
              Probá con otro puesto o localidad. Mientras tanto, dejá tu CV completo: los locales también buscan
              candidatos directamente.
            </p>
            <div className="tarjeta-bienvenida-botones">
              <a className="btn" href="/candidato/cv">Completar mi CV</a>
            </div>
          </div>
        )}

        {vacantesFiltradas.map((v) => {
          const urgente = v.urgencia === 'hoy' || v.urgencia === 'esta_semana';
          const cantidad = conteos[v.id] || 0;
          const cierre = cuentaRegresiva(v.cierra_at);
          const mirando = vistas[v.id] || 0;
          return (
            <div key={v.id} className="card vacante" style={{ marginBottom: 18 }}>
              <div className="vacante-cabecera">
                <CabeceraLocal local={v.local ? v.local : { nombre_local: 'Local de Posadas' }} />
                <div className="etiquetas-vacante">
                  {cierre && !cierre.vencida && (
                    <span className={`badge cierra ${cierre.inminente ? 'inminente' : ''}`}>{cierre.texto}</span>
                  )}
                  {v.cantidad_puestos === 1 && <span className="badge cupo">Solo 1 vacante</span>}
                  {v.cantidad_puestos > 1 && <span className="badge cupo">{v.cantidad_puestos} vacantes</span>}
                  {urgente && !cierre && <span className="badge urgente">Busca con urgencia</span>}
                </div>
              </div>

              <h3 className="vacante-puesto">
                {v.puesto === 'Otro' && v.puesto_otro ? v.puesto_otro : v.puesto}
              </h3>

              {v.sueldo && <p className="vacante-sueldo">{v.sueldo}</p>}

              <div className="vacante-datos">
                <span>{etiqueta(TURNOS, v.turno) || 'Turno a definir'}</span>
                <span>{etiqueta(DIAS_TRABAJO, v.dias_trabajo) || 'Días a definir'}</span>
                <span>{etiqueta(DISPONIBILIDAD, v.disponibilidad_requerida) || 'Jornada a definir'}</span>
                <span>
                  {v.experiencia_minima_anios > 0
                    ? `${v.experiencia_minima_anios} años de experiencia`
                    : 'Sin experiencia previa'}
                </span>
                {v.movilidad_requerida && <span>Movilidad propia</span>}
                {v.certificado_requerido && <span>Certificado de manipulación</span>}
              </div>

              {v.descripcion && <TextoFormateado texto={v.descripcion} className="vacante-descripcion" />}

              <div className="senales-vacante">
                {mirando > 1 && (
                  <span>
                    <span className="icono" aria-hidden="true">👁️</span>
                    {mirando} {mirando === 1 ? 'persona miró' : 'personas miraron'} esta vacante esta semana
                  </span>
                )}
                {cantidad > 0 && (
                  <span>
                    <span className="icono" aria-hidden="true">🔥</span>
                    {cantidad} {cantidad === 1 ? 'persona ya se postuló' : 'personas ya se postularon'}
                  </span>
                )}
                {cantidad === 0 && (
                  <span>
                    <span className="icono" aria-hidden="true">✨</span>
                    Nadie se postuló todavía: sé la primera persona
                  </span>
                )}
              </div>

              {miCv && !postuladas.has(v.id) && (() => {
                const { puntaje } = calcularPuntaje(v, miCv);
                const clase = puntaje >= 70 ? '' : puntaje >= 40 ? 'tibio' : 'frio';
                return (
                  <p style={{ margin: '0 0 14px' }}>
                    <span className={`match-chip ${clase}`}>Tenés {puntaje}% de compatibilidad</span>
                  </p>
                );
              })()}

              {postuladas.has(v.id) ? (
                <div className="aviso-postulado">
                  {misPostulaciones[v.id]?.estado === 'preseleccionado' && (() => {
                    const est = estadoPostulacion(misPostulaciones[v.id], v);
                    return (
                      <p style={{ margin: '0 0 8px' }}>
                        <span className={`pildora ${est.tono}`}>{est.titulo}</span>{' '}
                        {est.texto}
                      </p>
                    );
                  })()}
                  <strong>Ya te postulaste.</strong>
                  {misPostulaciones[v.id]?.cv_snapshot && (
                    <> Quedaste con{' '}
                    <strong>
                      {misPostulaciones[v.id].puntaje ?? calcularPuntaje(v, misPostulaciones[v.id].cv_snapshot).puntaje}% de
                      compatibilidad
                    </strong>, calculado con tu CV tal como estaba al momento de postularte.</>
                  )}
                  {' '}Si el local te propone una entrevista, te avisamos en tu panel: fijate la campanita arriba
                  a la derecha.
                  <p style={{ margin: '8px 0 0', fontSize: '0.84rem' }}>
                    Si editás tu CV ahora, esta postulación no cambia: el porcentaje quedó congelado cuando la
                    enviaste.
                  </p>
                  <button type="button" className="btn-accion quitar" style={{ marginTop: 12 }} onClick={() => retirarPostulacion(v)}>
                    Retirar postulación
                  </button>
                </div>
              ) : v.puesto === 'Otro' ? (
                <div>
                  <div className="form-field" style={{ maxWidth: 380 }}>
                    <label>Contanos a qué puesto te postulás</label>
                    <input
                      value={detalleOtro[v.id] || ''}
                      onChange={(e) => setDetalleOtro((d) => ({ ...d, [v.id]: e.target.value }))}
                    />
                  </div>
                  <button className="btn" disabled={!detalleOtro[v.id]} onClick={() => postularse(v, detalleOtro[v.id])}>
                    Postularme
                  </button>
                </div>
              ) : (
                <>
                  <button className="btn" onClick={() => postularse(v)}>Postularme</button>
                  {cierre && !cierre.vencida && (
                    <p className="micro-cta">
                      Las postulaciones cierran el{' '}
                      {new Date(v.cierra_at).toLocaleString('es-AR', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}.
                    </p>
                  )}
                  {!cierre && v.urgencia === 'hoy' && (
                    <p className="micro-cta">El local marcó que necesita cubrir el puesto esta semana.</p>
                  )}
                </>
              )}

              {!postuladas.has(v.id) && (
                <p className="micro-cta">
                  Buscá tranqui. Tu CV lo ve el local al que te postulás, y nadie más salvo que vos compartas tu link.
                </p>
              )}

              <p className="vacante-meta">
                {textoAntiguedad(v.created_at)}
                <span aria-hidden="true"> · </span>
                <button className="enlace-reporte" onClick={() => reportar(v)} type="button">
                  Reportar este aviso
                </button>
              </p>
            </div>
          );
        })}
        {vacantesFiltradas.length > 0 && (
          <>
          <div className="nota-final" style={{ marginTop: 28 }}>
            <strong>Sobre el porcentaje de compatibilidad.</strong> Se calcula comparando lo que cargaste en tu CV
            con los requisitos que el local declaró en la vacante: puesto, años de experiencia, turno,
            disponibilidad, movilidad, certificado y herramientas. No evalúa tus cualidades como persona ni tu
            idoneidad, y no influyen ni tu edad ni tu foto.
            <p style={{ margin: '10px 0 0' }}>
              Es orientativo: no decide nada. Quien decide a quién entrevistar y a quién contratar es siempre el
              empleador, y esa decisión la toma una persona. Un porcentaje bajo no te impide postularte.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              Si creés que tu porcentaje no refleja tu perfil, primero revisá que tu CV esté completo. Si aún
              querés que una persona de nuestro equipo lo revise, escribinos a{' '}
              <a href="mailto:gozzasabores@gmail.com?subject=Revisi%C3%B3n%20humana%20de%20mi%20compatibilidad">
                gozzasabores@gmail.com
              </a>{' '}
              y lo miramos a mano.
            </p>
          </div>

          <div className="nota-final">
            <strong>Trabajar no cuesta plata.</strong> Ningún local serio te pide dinero, tu clave bancaria ni que
            trabajes gratis "a prueba". Las entrevistas son en el local y en horario comercial. Si algo no te
            cierra, tocá "Reportar este aviso".
          </div>
          </>
        )}
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

export default function VacantesCandidato(props) {
  return (
    <GuardiaRol rol="candidato">
      <VacantesCandidatoContenido {...props} />
    </GuardiaRol>
  );
}
