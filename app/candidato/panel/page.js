'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

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

export default function PanelCandidato() {
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
    router.push('/');
  }

  if (cargando) return <div className="container">Cargando...</div>;
  if (!cv) return <div className="container">No encontramos tu CV.</div>;

  const pct = pctCompleto(cv);
  const faltas = queFalta(cv);
  const pendientes = entrevistas.filter((e) => e.estado === 'pendiente').length;
  const confirmadas = entrevistas.filter((e) => e.estado === 'confirmada').length;

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/vacantes', texto: 'Vacantes' }, { href: '/candidato/cv', texto: 'Mi CV' }, { href: '/candidato/entrevistas', texto: 'Entrevistas' }]} />
      </div>

      <div className="container" style={{ maxWidth: 900 }}>
        <h1>Hola{cv.nombre ? `, ${cv.nombre.split(' ')[0]}` : ''}</h1>

        <div className="fila-cifras" style={{ marginBottom: 8 }}>
          <div>
            <div className="panel-cifra">{postulaciones.length}</div>
            <div className="panel-cifra-label">{postulaciones.length === 1 ? 'postulación' : 'postulaciones'}</div>
          </div>
          <div>
            <div className="panel-cifra">{pendientes}</div>
            <div className="panel-cifra-label">entrevistas por responder</div>
          </div>
          <div>
            <div className="panel-cifra">{confirmadas}</div>
            <div className="panel-cifra-label">entrevistas confirmadas</div>
          </div>
          <div>
            <div className="panel-cifra">{vacantesAbiertas}</div>
            <div className="panel-cifra-label">vacantes abiertas hoy</div>
          </div>
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
                Un CV incompleto reduce tus chances: los locales filtran por experiencia, disponibilidad y herramientas,
                y si esos datos faltan tu perfil queda más abajo en el orden. Te falta cargar {faltas.slice(0, 3).join(', ')}
                {faltas.length > 3 ? ` y ${faltas.length - 3} cosa${faltas.length - 3 === 1 ? '' : 's'} más` : ''}.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <a className="btn" href="/candidato/cv">{pct === 100 ? 'Editar mi CV' : 'Completar mi CV'}</a>
              <a className="btn blanco" href="/candidato/mi-perfil">Ver y descargar</a>
            </div>
          </div>

          <div className="card">
            <h3>Qué hacer ahora</h3>
            <ul style={{ paddingLeft: 18, margin: '10px 0 0' }}>
              {pct < 100 && <li style={{ marginBottom: 8 }}>Terminá de cargar tu CV: es lo que más mueve la aguja.</li>}
              {pendientes > 0 && (
                <li style={{ marginBottom: 8 }}>
                  Tenés {pendientes} {pendientes === 1 ? 'propuesta' : 'propuestas'} de entrevista sin responder.{' '}
                  <a href="/candidato/entrevistas">Respondé acá</a>.
                </li>
              )}
              {postulaciones.length === 0 && vacantesAbiertas > 0 && (
                <li style={{ marginBottom: 8 }}>
                  Todavía no te postulaste a nada. <a href="/candidato/vacantes">Mirá las vacantes abiertas</a>.
                </li>
              )}
              <li style={{ marginBottom: 8 }}>
                Compartí el link de tu CV por WhatsApp cuando golpees puertas.{' '}
                <a href="/candidato/mi-perfil">Copialo acá</a>.
              </li>
              {cv.certificado_manipulacion === false && (
                <li>
                  Sacá el certificado de manipulación de alimentos: muchas vacantes lo piden como requisito excluyente.
                </li>
              )}
            </ul>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
