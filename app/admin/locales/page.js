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

    const { data: reps } = await supabase
      .from('reportes')
      .select('*')
      .eq('estado', 'abierto')
      .order('created_at', { ascending: false });
    setReportes(reps || []);

    setCargando(false);
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
      <Encabezado links={[{ href: '/empleador/vacantes', texto: 'Mis vacantes' }]} />
      <div className="container" style={{ maxWidth: 820 }}>
        <h1>Locales registrados</h1>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}

        {reportes.length > 0 && (
          <div className="aviso-legal" style={{ borderLeft: '3px solid var(--tierra)' }}>
            <strong>{reportes.length} {reportes.length === 1 ? 'aviso reportado' : 'avisos reportados'} sin revisar</strong>
            {reportes.map((r) => (
              <p key={r.id} style={{ margin: '8px 0 0', fontSize: '0.86rem' }}>
                {new Date(r.created_at).toLocaleDateString('es-AR')}: {r.motivo}
              </p>
            ))}
          </div>
        )}

        <div className="aviso-legal">
          <strong>Antes de aprobar un local, verificá.</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>Que la red social exista, tenga publicaciones recientes y coincida con el nombre de fantasía.</li>
            <li>Que la dirección corresponda a un local comercial y no a una casa particular.</li>
            <li>Que el CUIT sea de una empresa o monotributista, buscándolo en el padrón de AFIP.</li>
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
    </div>
  );
}

function FichaLocal({ local, onCambiar }) {
  const insta = (local.red_social || '').replace('@', '');
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ marginBottom: 2 }}>{local.nombre_local || '(sin nombre)'}</h3>
          <p className="mono" style={{ fontSize: '0.76rem', margin: 0 }}>
            {etiqueta(TIPOS_LOCAL, local.tipo_local)} · {local.ciudad}
          </p>
        </div>
        <span className={`badge ${local.estado === 'aprobado' ? 'alto' : local.estado === 'rechazado' ? 'bajo' : 'medio'}`}>
          {local.estado}
        </span>
      </div>

      <div style={{ marginTop: 12, fontSize: '0.9rem' }}>
        <p style={{ margin: '3px 0' }}><strong>Responsable:</strong> {local.nombre_responsable || '—'}</p>
        <p style={{ margin: '3px 0' }}><strong>Razón social:</strong> {local.razon_social || '—'}</p>
        <p style={{ margin: '3px 0' }}><strong>CUIT:</strong> {local.cuit || '—'}</p>
        <p style={{ margin: '3px 0' }}><strong>Dirección:</strong> {local.direccion || '—'}</p>
        <p style={{ margin: '3px 0' }}><strong>Teléfono:</strong> {local.telefono || '—'}</p>
        <p style={{ margin: '3px 0' }}><strong>Contacto público:</strong> {local.contacto || '—'}</p>
        <p style={{ margin: '3px 0' }}>
          <strong>Declaración jurada:</strong>{' '}
          {local.declaracion_jurada_at
            ? `firmada el ${new Date(local.declaracion_jurada_at).toLocaleDateString('es-AR')}`
            : 'no firmada (alta anterior al requisito)'}
        </p>
        <p style={{ margin: '3px 0' }}>
          <strong>Redes:</strong>{' '}
          {insta ? (
            <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer">@{insta}</a>
          ) : '—'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {local.estado !== 'aprobado' && (
          <button className="btn" onClick={() => onCambiar(local.id, 'aprobado', local.nombre_local)}>
            Aprobar
          </button>
        )}
        {local.estado !== 'rechazado' && (
          <button className="btn blanco" onClick={() => onCambiar(local.id, 'rechazado', local.nombre_local)}>
            Rechazar
          </button>
        )}
      </div>
      <Pie />
    </div>
  );
}
