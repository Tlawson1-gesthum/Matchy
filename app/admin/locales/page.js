'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { etiqueta, TIPOS_LOCAL } from '../../../lib/opciones';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

export default function AdminLocales() {
  const router = useRouter();
  const [esAdmin, setEsAdmin] = useState(false);
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reportes, setReportes] = useState([]);

  async function cargar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) { router.push('/empleador/login'); return; }

    const { data: admin } = await supabase
      .from('administradores').select('id').eq('id', uid).maybeSingle();

    if (!admin) {
      setEsAdmin(false);
      setCargando(false);
      return;
    }
    setEsAdmin(true);

    const { data, error: err } = await supabase
      .from('empleadores')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    setLocales(data || []);

    const { data: reps } = await supabase.rpc('reportes_detallados');
    setReportes(reps || []);

    setCargando(false);
  }

  async function resolverReporte(reporte, accion) {
    const { data: userData } = await supabase.auth.getUser();
    const admin = userData?.user?.id || null;

    if (accion === 'baja_vacante') {
      const ok = window.confirm(`¿Dar de baja la vacante de ${reporte.vacante_puesto}? Deja de verse en el listado.`);
      if (!ok) return;
      await supabase.from('vacantes').update({
        estado: 'suspendida',
        suspendida_at: new Date().toISOString(),
        suspendida_motivo: 'Dada de baja por un administrador tras un reporte',
      }).eq('id', reporte.vacante_id);
    }

    if (accion === 'suspender_local') {
      const ok = window.confirm(
        `¿Suspender a ${reporte.local_nombre}? Se le dan de baja todas las vacantes y no va a poder publicar más.`
      );
      if (!ok) return;
      await supabase.from('empleadores').update({
        estado: 'rechazado',
        motivo_rechazo: 'Suspendido tras un reporte de la comunidad',
      }).eq('id', reporte.empleador_id);
      await supabase.from('vacantes').update({
        estado: 'suspendida',
        suspendida_at: new Date().toISOString(),
        suspendida_motivo: 'El local fue suspendido',
      }).eq('empleador_id', reporte.empleador_id).eq('estado', 'activa');
    }

    if (accion === 'reactivar_vacante') {
      await supabase.from('vacantes').update({
        estado: 'activa',
        suspendida_at: null,
        suspendida_motivo: null,
      }).eq('id', reporte.vacante_id);
    }

    const { error: err } = await supabase.from('reportes').update({
      estado: accion === 'desestimar' ? 'desestimado' : 'revisado',
      resuelto_at: new Date().toISOString(),
      resuelto_por: admin,
      accion_tomada: accion,
    }).eq('id', reporte.id);

    if (err) { setError('No se pudo cerrar el reporte: ' + err.message); return; }
    cargar();
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(id, estado, nombre) {
    if (estado === 'rechazado') {
      const ok = window.confirm(`¿Rechazar a ${nombre}? No va a poder publicar vacantes.`);
      if (!ok) return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error: err } = await supabase.from('empleadores').update({
      estado,
      verificado_at: new Date().toISOString(),
      verificado_por: userData?.user?.id || null,
    }).eq('id', id);
    if (err) { setError('No se pudo actualizar: ' + err.message); return; }
    setLocales((l) => l.map((x) => (x.id === id ? { ...x, estado } : x)));
  }

  if (cargando) return <div className="container">Cargando...</div>;

  if (!esAdmin) {
    return (
      <div>
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }]} />
        <div className="container">
          <h1>Sin acceso</h1>
          <p>Esta pantalla es solo para administradores de Matchy.</p>
        </div>
      </div>
    );
  }

  const pendientes = locales.filter((l) => l.estado === 'pendiente');
  const resto = locales.filter((l) => l.estado !== 'pendiente');

  return (
    <div>
      <Encabezado
        links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }, { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' }]}
        campanaHref="/empleador/vacantes"
        destacado={{ href: '/admin/locales', texto: 'Aprobar locales', cantidad: pendientes.length }}
      />
      <div className="container" style={{ maxWidth: 820 }}>
        <h1>Locales registrados</h1>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}

        {reportes.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ color: 'var(--tierra)' }}>
              {reportes.length} {reportes.length === 1 ? 'aviso reportado' : 'avisos reportados'} sin revisar
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--texto-suave)' }}>
              Con tres reportes de personas distintas, la vacante se suspende sola hasta que la revises.
            </p>

            {reportes.map((r) => (
              <div key={r.id} className="card ficha-reporte" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{r.vacante_puesto || 'Vacante eliminada'}</h3>
                    <p className="mono" style={{ fontSize: '0.76rem', margin: 0 }}>
                      {r.local_nombre || 'Local desconocido'} · {new Date(r.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.reportes_misma_vacante > 1 && (
                      <span className="badge bajo">{r.reportes_misma_vacante} reportes</span>
                    )}
                    {r.vacante_estado && (
                      <span className={`badge ${r.vacante_estado === 'activa' ? 'medio' : 'bajo'}`}>
                        {r.vacante_estado}
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ margin: '12px 0', background: 'var(--panel)', padding: '10px 12px', borderRadius: 8 }}>
                  {r.motivo}
                </p>

                <p style={{ fontSize: '0.84rem', margin: '0 0 6px' }}>
                  <strong>Reportado por:</strong> {r.reportante_email || 'usuario eliminado'}
                </p>
                <p style={{ fontSize: '0.84rem', margin: '0 0 12px' }}>
                  <strong>Contacto del local:</strong> {r.local_telefono || 'sin teléfono'} ·{' '}
                  {r.local_red_social || 'sin red social'}
                </p>

                <div className="aviso-legal" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
                  Antes de decidir: mirá la vacante, revisá la red social del local y, si hace falta, llamá al
                  teléfono. Si el reporte menciona pedidos de dinero, datos bancarios o algo que parezca un delito,
                  suspendé el local y guardá una captura antes de actuar.
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {r.vacante_id && (
                    <a className="btn blanco" href={`/empleador/vacantes/${r.vacante_id}`} target="_blank" rel="noreferrer">
                      Ver la vacante
                    </a>
                  )}
                  <button className="btn blanco" onClick={() => resolverReporte(r, 'desestimar')}>
                    Desestimar
                  </button>
                  {r.vacante_estado === 'activa' && (
                    <button className="btn blanco" onClick={() => resolverReporte(r, 'baja_vacante')}>
                      Dar de baja la vacante
                    </button>
                  )}
                  {r.vacante_estado === 'suspendida' && (
                    <button className="btn blanco" onClick={() => resolverReporte(r, 'reactivar_vacante')}>
                      Reactivar la vacante
                    </button>
                  )}
                  <button className="btn" onClick={() => resolverReporte(r, 'suspender_local')}>
                    Suspender el local
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="aviso-legal">
          <strong>Antes de aprobar un local, verificá.</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>Abrí el enlace público: que exista, tenga publicaciones recientes y coincida con el nombre de fantasía.</li>
            <li>Que la dirección corresponda a un local comercial y no a una casa particular.</li>
            <li>Buscá el CUIT en el padrón de AFIP y confirmá que la razón social coincida con la declarada.</li>
            <li>Llamá al teléfono del responsable y confirmá que trabaja ahí. Es el paso que más fraude evita.</li>
            <li>Si algo no cierra, rechazalo. Es preferible perder un local real que habilitar uno falso.</li>
          </ul>
        </div>

        <h3 style={{ marginTop: 24 }}>
          Esperando aprobación ({pendientes.length})
        </h3>
        {pendientes.length === 0 && <p>No hay locales pendientes.</p>}
        {pendientes.map((l) => (
          <FichaLocal key={l.id} local={l} onCambiar={cambiarEstado} />
        ))}

        <h3 style={{ marginTop: 32 }}>Ya revisados ({resto.length})</h3>
        {resto.map((l) => (
          <FichaLocal key={l.id} local={l} onCambiar={cambiarEstado} />
        ))}
        <div style={{ height: 40 }} />
      </div>
      <Pie />
    </div>
  );
}

function Dato({ etiqueta: rotulo, children }) {
  return (
    <div className="dato">
      <span className="dato-rotulo">{rotulo}</span>
      <span className="dato-valor">{children || '—'}</span>
    </div>
  );
}

function FichaLocal({ local, onCambiar }) {
  const enlacePublico = (local.red_social || '').startsWith('http')
    ? local.red_social
    : `https://${(local.red_social || '').replace('@', '')}`;

  const estadoClase =
    local.estado === 'aprobado' ? 'aprobado' : local.estado === 'rechazado' ? 'rechazado' : 'pendiente';

  return (
    <article className="ficha-local">
      <header className="ficha-local-cabecera">
        <div>
          <h3 className="ficha-local-nombre">{local.nombre_local || '(sin nombre)'}</h3>
          <p className="ficha-local-rubro">
            {[etiqueta(TIPOS_LOCAL, local.tipo_local), local.ciudad].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`pildora ${estadoClase}`}>{local.estado}</span>
      </header>

      <div className="ficha-local-grid">
        <section className="ficha-bloque">
          <h4 className="ficha-bloque-titulo">Datos fiscales</h4>
          <Dato etiqueta="Responsable">{local.nombre_responsable}</Dato>
          <Dato etiqueta="Razón social">{local.razon_social}</Dato>
          <Dato etiqueta="CUIT">
            {local.cuit ? (
              <>
                {local.cuit}
                <a
                  className="enlace-sutil"
                  href="https://www.afip.gob.ar/sitio/externos/default.asp#tab3"
                  target="_blank"
                  rel="noreferrer"
                >
                  verificar en AFIP
                </a>
              </>
            ) : null}
          </Dato>
          <Dato etiqueta="Declaración jurada">
            {local.declaracion_jurada_at
              ? `Firmada el ${new Date(local.declaracion_jurada_at).toLocaleDateString('es-AR')}`
              : 'Sin firmar (alta anterior al requisito)'}
          </Dato>
        </section>

        <section className="ficha-bloque">
          <h4 className="ficha-bloque-titulo">Contacto y ubicación</h4>
          <Dato etiqueta="Dirección">{local.direccion}</Dato>
          <Dato etiqueta="Teléfono del responsable">{local.telefono}</Dato>
          <Dato etiqueta="Contacto público">{local.contacto}</Dato>
          <Dato etiqueta="Enlace público">
            {local.red_social ? (
              <a className="enlace-sutil" href={enlacePublico} target="_blank" rel="noreferrer">
                {local.red_social}
              </a>
            ) : null}
          </Dato>
        </section>
      </div>

      <footer className="ficha-local-acciones">
        {local.estado === 'aprobado' && (
          <span className="ficha-nota">
            {local.verificado_at
              ? `Aprobado el ${new Date(local.verificado_at).toLocaleDateString('es-AR')}`
              : 'Aprobado'}
          </span>
        )}
        <div className="ficha-botones">
          {local.estado !== 'rechazado' && (
            <button className="btn-rechazar" onClick={() => onCambiar(local.id, 'rechazado', local.nombre_local)}>
              Rechazar
            </button>
          )}
          {local.estado !== 'aprobado' && (
            <button className="btn" onClick={() => onCambiar(local.id, 'aprobado', local.nombre_local)}>
              Aprobar
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
