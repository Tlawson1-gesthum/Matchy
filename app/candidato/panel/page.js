'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import GuardiaRol from '../../../components/GuardiaRol';
import { IconoMaletin, IconoSobre, IconoCalendario, IconoMegafono } from '../../../components/IconosPanel';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';

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
        .from('postulaciones').select('*').eq('candidato_id', uid);
      setPostulaciones(posts || []);

      if (posts?.length) {
        const { data: ents } = await supabase
          .from('entrevistas').select('*').in('postulacion_id', posts.map((p) => p.id));
        setEntrevistas(ents || []);
      }

      const { count } = await supabase
        .from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'activa');
      setVacantesAbiertas(count || 0);

      setCargando(false);
    }
    cargar();
  }, [router]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (cargando) return <PantallaCarga texto="Preparando tu panel..." />;
  if (!cv) return <div className="container">No encontramos tu CV.</div>;

  const pct = pctCompleto(cv);
  const faltas = queFalta(cv);
  const pendientes = entrevistas.filter((e) => e.estado === 'pendiente').length;
  const confirmadas = entrevistas.filter((e) => e.estado === 'confirmada').length;

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
            <h3>Tu CV</h3>
            <div style={{ background: '#EFEDE8', borderRadius: 6, height: 8, margin: '10px 0' }}>
              <div style={{ width: `${pct}%`, background: pct === 100 ? '#2B4632' : '#D9A441', height: 8, borderRadius: 6 }} />
            </div>
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
            <h3>Qué hacer ahora</h3>

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
        <p style={{ marginTop: 28 }}>
          <button className="btn-accion" onClick={cerrarSesion}>Cerrar sesión</button>
        </p>
        <p style={{ marginTop: 8 }}>
          <a className="enlace-discreto" href="/cuenta/eliminar">Eliminar mi cuenta</a>
        </p>
        <div style={{ height: 40 }} />
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
