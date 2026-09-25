'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import GuardiaRol from '../../../components/GuardiaRol';
import { IconoMaletin, IconoSobre, IconoCalendario, IconoMegafono } from '../../../components/IconosPanel';
import BarraProgreso from '../../../components/BarraProgreso';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';
import { estadoPostulacion } from '../../../lib/estadoPostulacion';
import { iniciales } from '../../../components/CabeceraLocal';

function pctCompleto(cv) {
  const campos = [
    cv.nombre, cv.ciudad, cv.contacto, cv.puestos?.length, cv.presentacion,
    cv.experiencia?.length, cv.formacion?.length, cv.habilidades?.length,
    cv.herramientas_nivel?.length, cv.disponibilidad_horaria, cv.disponible_desde,
  ];
  return Math.round((campos.filter(Boolean).length / campos.length) * 100);
}

function queFalta(cv) {
  const faltas = [];
  if (!cv.nombre) faltas.push('tu nombre');
  if (!cv.contacto) faltas.push('un contacto');
  if (!cv.puestos?.length) faltas.push('los puestos que te interesan');
  if (!cv.presentacion) faltas.push('tu presentación');
  if (!cv.experiencia?.length) faltas.push('tu experiencia');
  if (!cv.formacion?.length) faltas.push('tu formación');
  if (!cv.habilidades?.length) faltas.push('tus habilidades');
  if (!cv.herramientas_nivel?.length) faltas.push('las herramientas que manejás');
  if (!cv.disponibilidad_horaria) faltas.push('tu disponibilidad');
  return faltas;
}

function PanelCandidatoContenido() {
  const router = useRouter();
  const [cv, setCv] = useState(null);
  const [postulaciones, setPostulaciones] = useState([]);
  const [entrevistas, setEntrevistas] = useState([]);
  const [vacantesPostuladas, setVacantesPostuladas] = useState({});
  const [vacantesAbiertas, setVacantesAbiertas] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { router.push('/candidato/login'); return; }

      const { data: miCv } = await supabase.from('cvs').select('*').eq('id', uid).single();
      setCv(miCv);

      const { data: posts } = await supabase
        .from('postulaciones')
        .select('id, vacante_id, candidato_id, puntaje, estado, created_at, puesto_otro, cv_snapshot, cv_editado_despues')
        .eq('candidato_id', uid);
      setPostulaciones(posts || []);

      if (posts?.length) {
        const { data: ents } = await supabase
          .from('entrevistas').select('*').in('postulacion_id', posts.map((p) => p.id));
        setEntrevistas(ents || []);

        // Las vacantes a las que se postuló, aunque ya estén cerradas: así ve si se cubrieron.
        const { data: vacs } = await supabase
          .from('vacantes').select('id, puesto, puesto_otro, estado, empleador_id')
          .in('id', posts.map((p) => p.vacante_id));
        const idsLocales = [...new Set((vacs || []).map((v) => v.empleador_id))];
        const { data: locales } = idsLocales.length
          ? await supabase.from('locales_publicos').select('id, nombre_local, logo_url').in('id', idsLocales)
          : { data: [] };
        const localPorId = Object.fromEntries((locales || []).map((l) => [l.id, l]));
        setVacantesPostuladas(Object.fromEntries(
          (vacs || []).map((v) => [v.id, {
            ...v,
            nombre_local: localPorId[v.empleador_id]?.nombre_local || null,
            logo_url: localPorId[v.empleador_id]?.logo_url || null,
          }])
        ));
      }

      const { count } = await supabase
        .from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'activa');
      setVacantesAbiertas(count || 0);

      setCargando(false);
    }
    cargar();
  }, [router]);

  if (cargando) return <PantallaCarga texto="Preparando tu panel..." />;
  if (!cv) return <div className="container">No encontramos tu CV.</div>;

  const pct = pctCompleto(cv);
  const faltas = queFalta(cv);
  const pendientes = entrevistas.filter((e) => e.estado === 'pendiente').length;
  const confirmadas = entrevistas.filter((e) => e.estado === 'confirmada').length;
  // La entrevista más reciente de cada postulación
  const entrevistaPorPostulacion = {};
  for (const e of [...entrevistas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
    entrevistaPorPostulacion[e.postulacion_id] = e;
  }
  // Una búsqueda cubierta o un aviso dado de baja ya no esperan nada del candidato:
  // esas tarjetas van al final y más apagadas. Dentro de cada grupo, la más nueva primero.
  const estaCerrada = (p) => ['cubierta', 'suspendida'].includes(vacantesPostuladas[p.vacante_id]?.estado);
  const misPostulaciones = [...postulaciones].sort((a, b) =>
    (estaCerrada(a) - estaCerrada(b)) || (new Date(b.created_at) - new Date(a.created_at))
  );

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/vacantes', texto: 'Vacantes' }, { href: '/candidato/cv', texto: 'Mi CV' }, { href: '/candidato/entrevistas', texto: 'Entrevistas' }]} campanaHref="/candidato/entrevistas" />

      <div className="container" style={{ maxWidth: 900 }}>
        <h1>Hola{cv.nombre ? `, ${cv.nombre.split(' ')[0]}` : ''}</h1>

        <div className="metricas">
          <div className="metrica">
            <span className="metrica-icono"><IconoMaletin /></span>
            <span className="metrica-numero">{postulaciones.length}</span>
            <span className="metrica-label">{postulaciones.length === 1 ? 'Postulación' : 'Postulaciones'}</span>
          </div>

          <div className="metrica">
            <span className="metrica-icono"><IconoSobre /></span>
            <span className="metrica-numero">{pendientes}</span>
            <span className="metrica-label">Entrevistas por responder</span>
          </div>

          <div className="metrica">
            <span className="metrica-icono"><IconoCalendario /></span>
            <span className="metrica-numero">{confirmadas}</span>
            <span className="metrica-label">Entrevistas confirmadas</span>
          </div>

          <a className="metrica destacada" href="/candidato/vacantes">
            <span className="metrica-icono">
              <IconoMegafono />
              {vacantesAbiertas > 0 && <span className="punto-estado" aria-hidden="true" />}
            </span>
            <span className="metrica-numero">{vacantesAbiertas}</span>
            <span className="metrica-label">Vacantes abiertas hoy</span>
          </a>
        </div>

        <div className="panel-grid">
          <div className="card">
            <h2 className="card-titulo">Tu CV</h2>
            <BarraProgreso pct={pct} margin="10px 0" />
            <strong>{pct}% completo</strong>

            {pct < 100 && (
              <div className="tip" style={{ marginTop: 12 }}>
                <strong>Un CV incompleto reduce tus chances:</strong> los locales filtran por{' '}
                <strong>experiencia</strong>, <strong>disponibilidad</strong> y <strong>herramientas</strong>, y si esos
                datos faltan tu perfil queda <strong>más abajo en el orden</strong>. Te falta cargar{' '}
                {faltas.slice(0, 3).join(', ')}
                {faltas.length > 3 ? ` y ${faltas.length - 3} cosa${faltas.length - 3 === 1 ? '' : 's'} más` : ''}.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <a className="btn-oxido-solido" href="/candidato/cv">{pct === 100 ? 'Editar mi CV' : 'Completar mi CV'}</a>
              <a className="btn blanco" href="/candidato/mi-perfil">Ver y descargar</a>
            </div>
          </div>

          <div className="card">
            <h2 className="card-titulo">Qué hacer ahora</h2>

            {pendientes > 0 ? (
              <a className="cta-principal" href="/candidato/entrevistas">
                Responder {pendientes} {pendientes === 1 ? 'entrevista' : 'entrevistas'}
              </a>
            ) : (
              <a className="cta-principal" href="/candidato/vacantes">Ver vacantes abiertas</a>
            )}

            <ul className="lista-secundaria">
              {pct < 100 && (
                <li>
                  Terminá de cargar tu CV: es lo que más mueve la aguja.{' '}
                  <a href="/candidato/cv">Seguir cargándolo</a>.
                </li>
              )}
              {pendientes > 0 && vacantesAbiertas > 0 && (
                <li>
                  Hay {vacantesAbiertas} {vacantesAbiertas === 1 ? 'vacante abierta' : 'vacantes abiertas'}.{' '}
                  <a href="/candidato/vacantes">Mirarlas</a>.
                </li>
              )}
              <li>
                Compartí el link de tu CV por WhatsApp cuando golpees puertas.{' '}
                <a href="/candidato/mi-perfil">Copialo acá</a>.
              </li>
              {!cv.certificado_manipulacion && !cv.certificado_url && (
                <li>
                  Sacá el certificado de manipulación de alimentos: muchas vacantes lo piden como requisito
                  excluyente.
                </li>
              )}
              {cv.certificado_manipulacion && !cv.certificado_url && (
                <li>
                  Subí una foto de tu certificado de manipulación.{' '}
                  <a href="/candidato/cv">Cargalo acá</a>. Sin el archivo suma la mitad de puntos.
                </li>
              )}
            </ul>
          </div>
        </div>

        {misPostulaciones.length > 0 && (
          <section className="seccion-postulaciones" aria-labelledby="titulo-postulaciones">
            <h2 className="card-titulo" id="titulo-postulaciones">Tus postulaciones</h2>
            <ul className="lista-postulaciones">
              {misPostulaciones.map((p) => {
                const v = vacantesPostuladas[p.vacante_id];
                const est = estadoPostulacion(p, v, entrevistaPorPostulacion[p.id]);
                const puesto = p.puesto_otro || (v?.puesto === 'Otro' && v?.puesto_otro ? v.puesto_otro : v?.puesto) || 'Vacante';
                const fecha = new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
                return (
                  <li key={p.id} className={`postulacion${estaCerrada(p) ? ' cerrada' : ''}`}>
                    <div className="postulacion-cabecera">
                      {v?.logo_url ? (
                        <img className="vacante-logo" src={v.logo_url} alt="" />
                      ) : (
                        <span className="vacante-logo inicial" aria-hidden="true">{iniciales(v?.nombre_local)}</span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <h3 className="postulacion-puesto">{puesto}</h3>
                        {v?.nombre_local && <span className="postulacion-local">{v.nombre_local}</span>}
                      </div>
                    </div>
                    <span className={`pildora ${est.tono}`}>{est.titulo}</span>
                    <p className="postulacion-texto">{est.texto}</p>
                    <div className="postulacion-pie">
                      <span className="postulacion-fecha">Te postulaste el {fecha}</span>
                      {est.accion && <a className="postulacion-accion" href="/candidato/entrevistas">Ir a Entrevistas</a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      <Pie />
    </div>
  );
}

export default function PanelCandidato(props) {
  return (
    <GuardiaRol rol="candidato">
      <PanelCandidatoContenido {...props} />
    </GuardiaRol>
  );
}
