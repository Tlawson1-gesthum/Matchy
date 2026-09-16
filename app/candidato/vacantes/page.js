'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { etiqueta, TURNOS, DIAS_TRABAJO, URGENCIAS, TIPOS_LOCAL, DISPONIBILIDAD } from '../../../lib/opciones';
import { calcularPuntaje } from '../../../lib/scoring';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

function diasDesde(fecha) {
  const ms = Date.now() - new Date(fecha).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function textoAntiguedad(fecha) {
  const d = diasDesde(fecha);
  if (d <= 0) return 'Publicada hoy';
  if (d === 1) return 'Publicada ayer';
  if (d < 7) return `Publicada hace ${d} días`;
  return `Publicada hace ${Math.floor(d / 7)} semanas`;
}

export default function VacantesCandidato() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [vacantes, setVacantes] = useState([]);
  const [conteos, setConteos] = useState({});
  const [postuladas, setPostuladas] = useState(new Set());
  const [filtroPuesto, setFiltroPuesto] = useState('');
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [detalleOtro, setDetalleOtro] = useState({});
  const [miCv, setMiCv] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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
        setError('No pudimos cargar las vacantes: ' + errVac.message);
        setCargando(false);
        return;
      }

      // Los datos del local se traen aparte: si esta consulta falla,
      // igual mostramos las vacantes en vez de dejar la pantalla vacía.
      const idsLocales = [...new Set((vac || []).map((v) => v.empleador_id))];
      const { data: locales } = idsLocales.length
        ? await supabase.from('empleadores').select('*').in('id', idsLocales)
        : { data: [] };
      const localPorId = Object.fromEntries((locales || []).map((e) => [e.id, e]));

      const conLocal = (vac || []).map((v) => ({ ...v, local: localPorId[v.empleador_id] || null }));
      // Si pudimos leer los locales, mostramos solo los aprobados.
      const visibles = locales && locales.length
        ? conLocal.filter((v) => !v.local || v.local.estado === 'aprobado')
        : conLocal;
      setVacantes(visibles);

      // Cuántos se postularon a cada una (para mostrar competencia real)
      const { data: todas } = await supabase.from('postulaciones').select('vacante_id');
      const cuenta = {};
      for (const p of todas || []) cuenta[p.vacante_id] = (cuenta[p.vacante_id] || 0) + 1;
      setConteos(cuenta);

      const { data: post } = await supabase
        .from('postulaciones').select('vacante_id').eq('candidato_id', uid);
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
      setConteos((c) => ({ ...c, [vacanteId]: (c[vacanteId] || 0) + 1 }));
    }
  }

  const vacantesFiltradas = vacantes.filter((v) => {
    if (filtroPuesto && v.puesto !== filtroPuesto) return false;
    if (filtroCiudad && v.local?.ciudad !== filtroCiudad) return false;
    return true;
  });
  const ciudadesDisponibles = [...new Set(vacantes.map((v) => v.local?.ciudad).filter(Boolean))];
  const puestosDisponibles = [...new Set(vacantes.map((v) => v.puesto))];

  if (cargando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <Encabezado links={[{ href: '/candidato/panel', texto: 'Mi panel' }, { href: '/candidato/mi-perfil', texto: 'Mi CV' }, { href: '/candidato/entrevistas', texto: 'Entrevistas' }]} />
      <div className="container">
        <h1>Vacantes en Posadas</h1>
        <p>{vacantes.length} {vacantes.length === 1 ? 'local está buscando' : 'locales están buscando'} gente ahora mismo.</p>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="form-field" style={{ minWidth: 200, flex: '1 1 200px' }}>
            <label>Filtrar por puesto</label>
            <select value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)}>
              <option value="">Todos</option>
              {puestosDisponibles.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ minWidth: 200, flex: '1 1 200px' }}>
            <label>Filtrar por localidad</label>
            <select value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)}>
              <option value="">Todas</option>
              {ciudadesDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {vacantesFiltradas.length === 0 && (
          <div className="card">
            <p>No hay vacantes activas para ese filtro por ahora.</p>
            <p style={{ marginBottom: 0 }}>
              Mientras tanto, dejá tu CV completo: los locales también buscan candidatos directamente.
            </p>
          </div>
        )}

        {vacantesFiltradas.map((v) => {
          const urgente = v.urgencia === 'hoy' || v.urgencia === 'esta_semana';
          const cantidad = conteos[v.id] || 0;
          return (
            <div key={v.id} className="card vacante" style={{ marginBottom: 18 }}>
              <div className="vacante-cabecera">
                <div>
                  <span className="vacante-local">{v.local?.nombre_local || 'Local de Posadas'}</span>
                  <span className="vacante-tipo">
                    {etiqueta(TIPOS_LOCAL, v.local?.tipo_local) || 'Gastronomía'}
                    {v.local?.ciudad ? ` · ${v.local.ciudad}` : ''}
                    {v.local?.direccion ? ` · ${v.local.direccion}` : ''}
                  </span>
                </div>
                {urgente && <span className="badge urgente">Busca con urgencia</span>}
              </div>

              <h3 style={{ margin: '10px 0 6px' }}>
                {v.puesto === 'Otro' && v.puesto_otro ? v.puesto_otro : v.puesto}
              </h3>

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

              {v.descripcion && <p style={{ marginTop: 12 }}>{v.descripcion}</p>}

              <p className="mono vacante-meta">
                {textoAntiguedad(v.created_at)}
                {cantidad > 0 && ` · ${cantidad} ${cantidad === 1 ? 'persona ya se postuló' : 'personas ya se postularon'}`}
                {cantidad === 0 && ' · Sé la primera persona en postularte'}
              </p>

              {miCv && (() => {
                const { puntaje } = calcularPuntaje(v, miCv);
                const clase = puntaje >= 70 ? '' : puntaje >= 40 ? 'tibio' : 'frio';
                return (
                  <p style={{ margin: '0 0 12px' }}>
                    <span className={`match-chip ${clase}`}>Tenés {puntaje}% de matchyar</span>
                  </p>
                );
              })()}

              {postuladas.has(v.id) ? (
                <div className="aviso-postulado">
                  Ya te postulaste. Te avisamos por mail y por acá si hacés match con el empleador.
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
                  <button className="btn" disabled={!detalleOtro[v.id]} onClick={() => postularse(v.id, detalleOtro[v.id])}>
                    Postularme
                  </button>
                </div>
              ) : (
                <button className="btn" onClick={() => postularse(v.id)}>Postularme</button>
              )}
            </div>
          );
        })}
        {vacantesFiltradas.length > 0 && (
          <p className="disclaimer">
            El porcentaje de match es una estimación automática que compara los datos de tu CV con lo que pidió el
            local. Es orientativo: no garantiza una entrevista, una contratación ni ningún resultado, y la decisión de
            contratar es siempre del empleador. Un porcentaje bajo no te impide postularte.
          </p>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
